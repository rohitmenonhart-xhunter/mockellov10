import React, { useEffect, useState } from 'react';
import { llmService, LLMStatus, type ProgressUpdate, modelOptions } from '@/lib/llm';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ModelLoadingUIProps {
  onModelLoaded?: () => void;
}

export function ModelLoadingUI({ onModelLoaded }: ModelLoadingUIProps) {
  const [status, setStatus] = useState<LLMStatus>(llmService.getStatus());
  const [progress, setProgress] = useState<ProgressUpdate>(llmService.getProgress());
  const [selectedModel, setSelectedModel] = useState<string>(modelOptions[0].id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Register listeners for status and progress updates
    const unsubscribeStatus = llmService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'error') {
        setError('Failed to load model. Please try again or choose a different model.');
      } else if (newStatus === 'ready' && onModelLoaded) {
        onModelLoaded();
      }
    });

    const unsubscribeProgress = llmService.onProgressChange(setProgress);

    return () => {
      unsubscribeStatus();
      unsubscribeProgress();
    };
  }, [onModelLoaded]);

  // Function to handle model selection
  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    setError(null);
    await llmService.setModel(modelId);
  };

  // Function to start loading the model
  const handleLoadModel = async () => {
    setError(null);
    try {
      await llmService.initialize();
    } catch (err) {
      setError('Failed to initialize model. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Browser-Based AI Interview Coach
        </h2>
        <p className="text-sm text-gray-600">
          This app runs advanced AI models directly in your browser - no server required!
        </p>
      </div>

      <div className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Select Model</label>
          <Select
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={status !== 'idle' && status !== 'error' && status !== 'ready'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {modelOptions.find(m => m.id === selectedModel)?.description || 'A compact language model'}
          </p>
        </div>

        {/* Status and Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Status:</span>
            <span className="capitalize text-gray-800">
              {status === 'idle' ? 'Ready to load' : status}
            </span>
          </div>

          {(status === 'downloading' || status === 'loading' || status === 'initializing') && (
            <div className="space-y-1">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.min(progress.progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 text-right">{progress.detail || `${Math.round(progress.progress)}%`}</p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>

        {/* Action Button */}
        {status === 'idle' || status === 'error' ? (
          <Button 
            className="w-full" 
            onClick={handleLoadModel}
          >
            Load Models
          </Button>
        ) : status === 'ready' ? (
          <div className="text-center py-2 text-green-600 font-medium">
            Models loaded successfully! ✓
          </div>
        ) : (
          <Button className="w-full" disabled>
            {status === 'initializing' ? 'Initializing...' : 
             status === 'downloading' ? 'Downloading...' : 'Loading...'}
          </Button>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>Note: The models will be downloaded to your browser (~600-800MB total). This may take a few minutes depending on your connection.</p>
        </div>
      </div>
    </div>
  );
} 