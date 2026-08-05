import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Eye,
  Users,
  Heart,
  Crown,
  Gift,
  Sparkles,
  Music2,
  Gamepad2,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CreatorStudio() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: userPosts = [] } = trpc.posts.getByUserId.useQuery(
    { userId: user?.id || 0, limit: 100 },
    { enabled: !!user }
  );

  // Calculate analytics
  const totalViews = userPosts.reduce((sum, post: any) => sum + (post.views || 0), 0);
  const totalLikes = userPosts.reduce((sum, post: any) => sum + (post.likes || 0), 0);
  const totalComments = userPosts.reduce((sum, post: any) => sum + (post.comments || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="text-white/50">Sign in to access your creator dashboard</p>
          <Button
            onClick={startLogin}
            className="bg-gradient-to-r from-fuchsia-600 to-rose-600"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const monetizationTools = [
    { icon: Crown, label: "Service+", desc: "Boost your reach" },
    { icon: Gift, label: "LIVE rewards", desc: "Track gifts received" },
    { icon: Sparkles, label: "Subscriptions", desc: "Recurring revenue" },
    { icon: Music2, label: "Work with Artists", desc: "Collaborate" },
    { icon: Gift, label: "Video Gifts", desc: "Earn from gifts" },
    { icon: Gamepad2, label: "Gaming Incentive", desc: "Gaming rewards" },
  ];

  const academyTopics = [
    { title: "Hooks that hold viewers", duration: "4 min" },
    { title: "Lighting like a pro", duration: "6 min" },
    { title: "Caption strategy 101", duration: "3 min" },
    { title: "Your first 1k followers", duration: "5 min" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-4">
        <h1 className="text-2xl font-bold">Creator Studio</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Analytics Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Analytics Overview</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-white/5 border-white/10 p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-white/50 mt-1">Views</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 text-rose-400" />
              </div>
              <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
              <p className="text-xs text-white/50 mt-1">Likes</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-fuchsia-400" />
              </div>
              <p className="text-2xl font-bold">{userPosts.length}</p>
              <p className="text-xs text-white/50 mt-1">Posts</p>
            </Card>
          </div>
        </div>

        {/* Monetization */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Monetization Tools</h2>
          <div className="grid grid-cols-2 gap-3">
            {monetizationTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.label}
                  className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Icon className="h-6 w-6 mb-2 text-cyan-400" />
                  <p className="font-medium text-sm">{tool.label}</p>
                  <p className="text-xs text-white/50 mt-1">{tool.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Creator Academy */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Creator Academy</h2>
          <div className="space-y-2">
            {academyTopics.map((topic) => (
              <Card
                key={topic.title}
                className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-fuchsia-600 to-cyan-600 p-2 rounded-lg">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{topic.title}</p>
                    <p className="text-xs text-white/50">{topic.duration}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Posts</h2>
          {userPosts.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <p className="text-white/50 mb-4">No posts yet</p>
              <Button
                onClick={() => navigate("/create")}
                className="bg-gradient-to-r from-fuchsia-600 to-rose-600"
              >
                Create Your First Post
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userPosts.slice(0, 6).map((post: any) => (
                <Card
                  key={post.id}
                  className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-colors cursor-pointer aspect-square"
                >
                  {post.videoUrl ? (
                    <video
                      src={post.videoUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : post.photoUrl ? (
                    <img
                      src={post.photoUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      No media
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
