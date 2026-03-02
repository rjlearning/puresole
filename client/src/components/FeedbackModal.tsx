import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function FeedbackModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [category, setCategory] = useState("general");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast({ title: "Error", description: "Feedback content cannot be empty", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await apiRequest("POST", "/api/feedback", { category, content });
            toast({ title: "Feedback Sent", description: "Thank you for sharing your thoughts with us!" });
            setContent("");
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Submission Failed", description: "There was an error sending your feedback.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Provide Feedback</DialogTitle>
                    <DialogDescription>
                        We'd love to hear your thoughts, suggestions, or reports on any issues.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General Feedback</SelectItem>
                                <SelectItem value="feature_request">Feature Request</SelectItem>
                                <SelectItem value="bug">Report a Bug</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Textarea
                            placeholder="Tell us what's on your mind..."
                            className="resize-none h-32"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Sending..." : "Submit Feedback"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
