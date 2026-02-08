import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Share2, ChevronRight, Home, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import RoadmapSidebar from "@/components/roadmap/RoadmapSidebar";
import StatsBar from "@/components/roadmap/StatsBar";
import TaskCard from "@/components/roadmap/TaskCard";
import MobileNav from "@/components/roadmap/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_URL = 'https://compliancego.onrender.com/api';

interface Task {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "pending";
  timeline: string;
  description: string;
  requirements: string[];
  portalUrl: string;
}

interface RoadmapCategory {
  id: string;
  category: string;
  tasks: Task[];
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  sector: string;
  location: string;
  structure: string;
  teamSize: number;
  completedCount: number;
  totalCount: number;
  roadmapData: RoadmapCategory[];
}

const Roadmap = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("company");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project roadmap data
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!token || !projectId) {
        navigate('/auth');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/projects/${projectId}/roadmap`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success) {
          setProjectData(data.project);
          // Set first category as active
          if (data.project.roadmapData.length > 0) {
            setActiveCategory(data.project.roadmapData[0].id);
          }
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch roadmap",
            variant: "destructive",
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Fetch roadmap error:', error);
        toast({
          title: "Error",
          description: "Failed to load roadmap. Please try again.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmap();
  }, [projectId, token, navigate, toast]);

  // Handle task completion
  const handleTaskComplete = async (taskId: string) => {
    if (!projectId || !token) return;

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          status: 'completed'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setProjectData(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            completedCount: data.completedCount,
            roadmapData: prev.roadmapData.map(category => ({
              ...category,
              tasks: category.tasks.map(task =>
                task.id === taskId ? { ...task, status: 'completed' as const } : task
              )
            }))
          };
        });

        toast({
          title: "Task Completed!",
          description: "Great progress! Keep going.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Update task error:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  // Calculate category progress and stats
  const categories = useMemo(() => {
    if (!projectData) return [];

    return projectData.roadmapData.map((section) => {
      const completedCount = section.tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const progress = Math.round((completedCount / section.tasks.length) * 100);

      return {
        id: section.id,
        name: section.category,
        icon: null,
        progress,
        taskCount: section.tasks.length,
        completedCount,
      };
    });
  }, [projectData]);

  // Calculate overall stats
  const stats = useMemo(() => {
    if (!projectData) return { readinessScore: 0, estimatedFees: 0, launchEta: 40 };

    const readinessScore = projectData.totalCount > 0
      ? Math.round((projectData.completedCount / projectData.totalCount) * 100)
      : 0;

    return {
      readinessScore,
      estimatedFees: 15500,
      launchEta: 40 - Math.floor((projectData.completedCount / projectData.totalCount) * 40),
    };
  }, [projectData]);

  // Get active section
  const activeSection = projectData?.roadmapData.find((s) => s.id === activeCategory);

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading your roadmap...</p>
          </div>
        </div>
      </>
    );
  }

  if (!projectData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Project not found</h2>
            <Link to="/dashboard">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-16">
        <div className="flex">
          {/* Sidebar - Desktop */}
          <RoadmapSidebar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-auto">
            <div className="max-w-5xl mx-auto p-6 lg:p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                {/* Mobile Nav + Breadcrumb */}
                <div className="flex items-center gap-4 mb-4">
                  <MobileNav
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                  />

                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link to="/dashboard" className="flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            Dashboard
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbPage>Roadmap</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                {/* Title and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                      {projectData.name}
                    </h1>
                    <p className="text-muted-foreground">
                      {projectData.sector} • {projectData.structure} • {projectData.location}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Stats Bar */}
              <div className="mb-8">
                <StatsBar
                  readinessScore={stats.readinessScore}
                  estimatedFees={stats.estimatedFees}
                  launchEta={stats.launchEta}
                />
              </div>

              {/* Active Category Tasks */}
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {activeSection?.category}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {activeSection?.tasks.filter((t) => t.status === "completed").length}/
                    {activeSection?.tasks.length} completed
                  </span>
                </div>

                <div className="space-y-3">
                  {activeSection?.tasks.map((task, index) => {
                    // Determine if task should be locked
                    const previousTask = activeSection.tasks[index - 1];
                    const isLocked =
                      index > 0 &&
                      previousTask?.status !== "completed" &&
                      task.status === "pending";

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <TaskCard
                          title={task.title}
                          status={isLocked ? "locked" : task.status}
                          timeline={task.timeline}
                          description={task.description}
                          requirements={task.requirements}
                          portalUrl={task.portalUrl}
                          isLocked={isLocked}
                          onComplete={() => handleTaskComplete(task.id)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 bg-navy rounded-xl p-8 text-center"
              >
                <h2 className="text-xl font-bold text-primary-foreground mb-2">
                  Need Help Executing This Roadmap?
                </h2>
                <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
                  Connect with our network of verified legal experts and CAs who
                  specialize in startup compliance.
                </p>
                <Button className="bg-accent hover:bg-teal-light text-accent-foreground">
                  Find a Professional
                </Button>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Roadmap;