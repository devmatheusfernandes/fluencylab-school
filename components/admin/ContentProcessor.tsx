'use client';

import { useState } from 'react';
import { Content } from '@/types/content';
import { generateCandidates, processBatch } from '@/actions/content-processing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, AlertCircle, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ContentProcessorProps {
  content: Content;
}

export function ContentProcessor({ content }: ContentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const router = useRouter();

  const handleAnalyze = async () => {
    try {
      setIsProcessing(true);
      setProgress('Analyzing text with Gemini (Level Detection + Vocabulary)...');
      
      const result = await generateCandidates(content.id, content.transcript);
      
      if (result.success) {
        toast.success(`Analysis complete. Level detected: ${result.level}. ${result.count} candidates found.`);
        router.refresh();
      } else {
        toast.error('Analysis failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during analysis');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const handleProcessBatch = async () => {
    try {
      setIsProcessing(true);
      let completed = false;
      let totalProcessed = 0;

      while (!completed) {
        setProgress(`Processing batch... Total processed: ${totalProcessed}`);
        
        const result = await processBatch(content.id);
        
        if (result.completed) {
          completed = true;
          toast.success('All items processed successfully!');
        } else {
          totalProcessed += result.itemsProcessed || 0;
          setProgress(`Processing batch... Total processed: ${totalProcessed}. Items left: ${result.itemsLeft}`);
          // Small delay to prevent hammering/UI freeze
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Error processing batch');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const getStatusBadge = (status: Content['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'analyzing': return <Badge variant="outline" className="animate-pulse">Analyzing</Badge>;
      case 'processing_items': return <Badge variant="default">Processing</Badge>;
      case 'ready': return <Badge className="bg-green-500">Ready</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-bold">{content.title}</CardTitle>
          {content.audioUrl && (
             <Volume2 className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {getStatusBadge(content.status)}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-500 mb-2">
            Level: {content.level || <span className="italic">Pending AI Detection</span>} | Items: {content.relatedItemIds?.length || 0}
            {content.candidatesQueue && content.candidatesQueue.length > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                ({content.candidatesQueue.length} pending)
              </span>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            {content.status === 'draft' && (
              <Button 
                onClick={handleAnalyze} 
                disabled={isProcessing}
                size="sm"
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Analyze Text
              </Button>
            )}

            {content.status === 'processing_items' && (
              <Button 
                onClick={handleProcessBatch} 
                disabled={isProcessing}
                size="sm"
                variant="secondary"
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Loader2 className="mr-2 h-4 w-4" />}
                Process Queue ({content.candidatesQueue?.length || 0})
              </Button>
            )}

            {content.status === 'ready' && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="mr-2 h-4 w-4" />
                Processing Complete
              </div>
            )}
            
            {content.status === 'error' && (
               <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="mr-2 h-4 w-4" />
                Error occurred
                <Button variant="outline" size="sm" className="ml-2" onClick={handleAnalyze}>Retry Analysis</Button>
              </div>
            )}
          </div>

          {isProcessing && progress && (
            <div className="text-xs text-muted-foreground mt-2">
              {progress}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
