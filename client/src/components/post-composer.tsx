import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Send } from "lucide-react";
import type { CreatorPost } from "@shared/schema";

interface PostComposerProps {
  botId: string;
  creatorId: string;
}

export function PostComposer({ botId, creatorId }: PostComposerProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: async (postContent: string) => {
      return await apiRequest("POST", `/api/bots/${botId}/posts`, {
        content: postContent,
        postType: "text",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots", botId, "posts"] });
      setContent("");
      toast({
        title: "Post published",
        description: "Your update has been shared with subscribers",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to publish post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(content.trim());
  };

  return (
    <Card data-testid="post-composer">
      <CardHeader>
        <CardTitle className="text-lg">Share an Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share insights, strategy updates, or important announcements with your subscribers..."
            className="min-h-[120px] resize-none"
            disabled={createPostMutation.isPending}
            data-testid="post-composer-textarea"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createPostMutation.isPending || !content.trim()}
              data-testid="post-composer-submit"
            >
              <Send className="h-4 w-4 mr-2" />
              {createPostMutation.isPending ? "Publishing..." : "Publish Update"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
