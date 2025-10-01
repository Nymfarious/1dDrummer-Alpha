import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AICoachPanelProps {
  bpm: number;
  timeSignature: string;
}

export const AICoachPanel = ({ bpm, timeSignature }: AICoachPanelProps) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{
    requestsUsed?: number;
    trialEndsAt?: string;
  }>({});
  const [trialEnded, setTrialEnded] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a question or request for your AI coach.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setTrialEnded(false);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('practice-coach', {
        body: { 
          message: message.trim(),
          context: {
            bpm,
            timeSignature,
            sessionDuration: 'current session'
          }
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (functionData.error) {
        if (functionData.error === 'trial_ended') {
          setTrialEnded(true);
          setResponse(functionData.message);
          setTrialInfo({ trialEndsAt: functionData.trialEndedAt });
          return;
        }
        throw new Error(functionData.error);
      }

      setResponse(functionData.message);
      setTrialInfo({
        requestsUsed: functionData.requestsUsed,
        trialEndsAt: functionData.trialEndsAt
      });
      setMessage('');

    } catch (error: any) {
      console.error('AI Coach error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get coaching advice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTrialEndDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Practice Coach
          </CardTitle>
          <CardDescription>
            Get personalized practice advice for Scottish pipe band drumming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trialInfo.trialEndsAt && !trialEnded && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Free trial active until {formatTrialEndDate(trialInfo.trialEndsAt)}
                {trialInfo.requestsUsed && ` • ${trialInfo.requestsUsed} requests used`}
              </AlertDescription>
            </Alert>
          )}

          {trialEnded && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {response}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Question</label>
            <Textarea
              placeholder="Ask for practice tips, technique advice, or session recommendations... 
              
Examples:
• How can I improve my flam technique?
• Suggest a practice routine for 6/8 marches
• What should I focus on at 92 BPM?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={loading || trialEnded}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !message.trim() || trialEnded}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Coaching Advice
              </>
            )}
          </Button>

          {response && !trialEnded && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Coach's Advice:
              </h4>
              <p className="text-sm whitespace-pre-wrap">{response}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p className="font-semibold mb-1">Tips for better results:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Be specific about what you're practicing</li>
              <li>Mention your current skill level if relevant</li>
              <li>Ask about Scottish pipe band traditions and techniques</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};