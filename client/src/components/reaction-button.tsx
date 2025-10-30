import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Heart } from "lucide-react";
import type { PostReaction } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface ReactionButtonProps {
  postId: string;
}

export function ReactionButton({ postId }: ReactionButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions = [] } = useQuery<PostReaction[]>({
    queryKey: ["/api/posts", postId, "reactions"],
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      return apiRequest("POST", `/api/posts/${postId}/reactions`, { reactionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "reactions"] });
    },
  });

  const likeCount = reactions.filter(r => r.reactionType === "like").length;
  const userLiked = user ? reactions.some(r => r.userId === (user as any).sub && r.reactionType === "like") : false;

  const handleToggleLike = () => {
    if (!user) return;
    toggleReactionMutation.mutate("like");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={!user || toggleReactionMutation.isPending}
      className={userLiked ? "text-red-500" : ""}
      data-testid={`button-like-post-${postId}`}
    >
      <Heart className={`h-4 w-4 mr-1 ${userLiked ? "fill-current" : ""}`} />
      <span data-testid={`text-like-count-${postId}`}>{likeCount}</span>
    </Button>
  );
}
