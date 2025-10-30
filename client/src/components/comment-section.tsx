import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { PostComment, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle } from "lucide-react";

interface CommentSectionProps {
  postId: string;
}

type CommentWithUser = PostComment & { user: User };

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: comments = [], isLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/posts", postId, "comments"],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      setNewComment("");
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && user) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        data-testid={`button-toggle-comments-${postId}`}
        aria-label={`${showComments ? 'Hide' : 'Show'} comments`}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        <span>{showComments ? 'Hide' : 'Show'} comments</span>
        {comments.length > 0 && (
          <span className="ml-1 text-muted-foreground" data-testid={`text-comment-count-${postId}`}>
            ({comments.length})
          </span>
        )}
      </Button>

      {showComments && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" data-testid={`comment-author-${comment.id}`}>
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground" data-testid={`comment-time-${comment.id}`}>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm" data-testid={`comment-content-${comment.id}`}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
          )}

          {user && (
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                data-testid={`input-comment-${postId}`}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                data-testid={`button-submit-comment-${postId}`}
              >
                {createCommentMutation.isPending ? "Posting..." : "Comment"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
