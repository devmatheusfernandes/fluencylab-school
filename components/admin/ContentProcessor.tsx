'use client';

import { useState } from 'react';
import { Content } from '@/types/content';
import { generateCandidates, processBatch, generateTranscriptWithTimestamps } from '@/actions/content-processing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Play, CheckCircle, AlertCircle, Volume2, FileAudio, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ContentProcessorProps {
  content: Content;
}

export function ContentProcessor({ content }: ContentProcessorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isGeneratingTimestamps, setIsGeneratingTimestamps] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const router = useRouter();
  const isBusy = isAnalyzing || isProcessingBatch || isGeneratingTimestamps;

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
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
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  const handleProcessBatch = async () => {
    try {
      setIsProcessingBatch(true);
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
      setIsProcessingBatch(false);
      setProgress('');
    }
  };

  const handleGenerateTimestamps = async () => {
    try {
      setIsGeneratingTimestamps(true);
      setProgress('Generating transcript with timestamps (Gemini Audio)...');
      
      const result = await generateTranscriptWithTimestamps(content.id);
      
      if (result.success) {
        toast.success(`Transcript with timestamps generated. ${result.count} segments.`);
        router.refresh();
      } else {
        toast.error('Failed to generate timestamps');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsGeneratingTimestamps(false);
      setProgress('');
    }
  };

  const getStatusBadge = (status: Content['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'analyzing': return <Badge variant="outline" className="animate-pulse border-amber-400 text-amber-600">Analyzing</Badge>;
      case 'processing_items': return <Badge variant="default" className="animate-pulse">Processing</Badge>;
      case 'ready': return <Badge className="bg-green-500 hover:bg-green-600">Ready</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full mb-4 overflow-hidden transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-bold truncate max-w-[300px] sm:max-w-md">
            {content.title}
          </CardTitle>
          {content.audioUrl && (
             <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
        {getStatusBadge(content.status)}
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex flex-col gap-4">
          {/* Metadata Section */}
          <div className={`text-sm text-muted-foreground flex items-center gap-2 flex-wrap transition-opacity duration-300 ${isBusy ? 'opacity-50' : 'opacity-100'}`}>
            <span className="flex items-center gap-1">
              Level: {content.level ? <Badge variant="outline" className="text-xs">{content.level}</Badge> : <span className="italic text-xs">Pending</span>}
            </span>
            <span className="text-border">|</span>
            <span>Items: {content.relatedItemIds?.length || 0}</span>
            
            {content.candidatesQueue && content.candidatesQueue.length > 0 && (
              <span className="ml-auto text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                {content.candidatesQueue.length} pending
              </span>
            )}
          </div>
          
          {/* Actions Section */}
          <div className="flex flex-wrap gap-2 items-center">
            {content.status === 'draft' && (
              <>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  size="sm"
                  className="transition-all"
                >
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Analyze Text
                </Button>

                {content.audioUrl && (
                  <Button
                    onClick={handleGenerateTimestamps}
                    disabled={isGeneratingTimestamps}
                    size="sm"
                    variant="outline"
                  >
                    {isGeneratingTimestamps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileAudio className="mr-2 h-4 w-4" />}
                    Generate Timestamps
                  </Button>
                )}
              </>
            )}

            {content.status === 'processing_items' && (
              <>
                <Button 
                  onClick={handleProcessBatch} 
                  disabled={isProcessingBatch}
                  size="sm"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {isProcessingBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Process Queue ({content.candidatesQueue?.length || 0})
                </Button>

                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Find More Items
                </Button>
              </>
            )}

            {content.status === 'ready' && (
              <>
                <div className="flex items-center text-emerald-600 text-sm font-medium px-2 py-1 rounded-md bg-emerald-100">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Processing Complete
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  size="sm"
                  variant="outline"
                  className="ml-2"
                >
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Find More Items
                </Button>

                {content.audioUrl && (
                  <Button
                    onClick={handleGenerateTimestamps}
                    disabled={isGeneratingTimestamps}
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                  >
                    {isGeneratingTimestamps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileAudio className="mr-2 h-4 w-4" />}
                    Re-generate Timestamps
                  </Button>
                )}
              </>
            )}
            
            {content.status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm w-full bg-red-50 p-2 rounded-md">
                <AlertCircle className="mr-2 h-4 w-4" />
                Error occurred
                <Button variant="outline" size="sm" className="ml-auto bg-white hover:bg-red-50" onClick={handleAnalyze}>Retry Analysis</Button>
              </div>
            )}
          </div>

          {/* Enhanced Progress Indicator */}
          {progress && (
            <div className="flex items-center gap-3 p-3 mt-2 rounded-md bg-secondary/50 border border-secondary text-sm text-secondary-foreground animate-in fade-in slide-in-from-top-2 duration-300">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
              <span className="font-medium">{progress}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Exported Skeleton component for parent usage
export function ContentProcessorSkeleton() {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2 w-2/3">
          <Skeleton className="h-6 w-3/4 max-w-[200px]" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-6 w-16" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}