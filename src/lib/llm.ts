import {
  CreateWebWorkerMLCEngine,
  WebWorkerMLCEngine,
  InitProgressCallback,
  ChatCompletionRequestNonStreaming,
  ChatCompletionRequestStreaming,
  ChatCompletionChunk,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam
} from "@mlc-ai/web-llm";

// Function to detect if we're on an Apple device
const isAppleDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /(mac|iphone|ipad|ipod)/.test(userAgent);
};

// Model options with the exact model details provided
export const modelOptions = [
  {
    name: 'Llama 3.2 1B (Instruct)',
    displayName: 'Meta Llama 3.2 1B Instruct',
    // Exact model ID provided by the user
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    maxTokens: 4096,
    description: 'Llama 3.2 1B Instruct - A compact yet powerful language model by Meta (~600MB).',
  },
  
];

// Status of the model loading process
export type LLMStatus = 
  | 'idle' 
  | 'initializing' 
  | 'downloading' 
  | 'loading' 
  | 'ready' 
  | 'error';

export interface ProgressUpdate {
  progress: number;
  detail?: string;
}

export class LLMService {
  private static instance: LLMService;
  private engine: WebWorkerMLCEngine | null = null;
  private status: LLMStatus = 'idle';
  private progress: ProgressUpdate = { progress: 0 };
  private selectedModel = modelOptions[0].id; // Default to Llama 3.2 1B
  private statusListeners: Array<(status: LLMStatus) => void> = [];
  private progressListeners: Array<(progress: ProgressUpdate) => void> = [];
  private isInitialized = false;
  private isLoading = false;
  private worker: Worker | null = null;
  private systemPrompt = "You are an interviewer conducting a job interview. Always start with 'Introduce yourself?' Keep all responses extremely brief, never exceeding 3 lines. Ask follow-up questions frequently to dig deeper into the candidate's answers. Be direct and professional.";

  private constructor() {
    console.log(`Running on ${isAppleDevice() ? 'Apple' : 'Windows/Other'} device`);
    console.log(`Selected model: ${this.selectedModel}`);
    
    // Check if we were previously initialized
    const cachedStatus = localStorage.getItem('llm_status');
    if (cachedStatus === 'ready') {
      this.status = 'idle'; // We'll still need to initialize
      this.checkCachedModels();
    }
    
    // Add cleanup on page unload
    window.addEventListener('beforeunload', this.cleanup);
  }

  // Check if models are cached in IndexedDB
  private async checkCachedModels() {
    try {
      // We don't need to do an actual check - WebLLM will handle this internally
      // Just update UI to show we're ready to load from cache
      console.log('Checking for cached models...');
      this.updateProgress({ progress: 0, detail: 'Ready to load from cache' });
    } catch (error) {
      console.error('Error checking cached models:', error);
    }
  }

  // Singleton pattern to ensure only one instance
  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.isLoading) {
      return false;
    }

    this.isLoading = true;
    this.updateStatus('initializing');
    this.updateProgress({ progress: 0, detail: 'Starting initialization...' });

    try {
      // Setup progress callback
      const initProgressCallback: InitProgressCallback = (report) => {
        const progress = report.progress * 100;
        let detail = report.text || `Loading model: ${Math.round(progress)}%`;
        
        // Check if loading from cache
        if (report.text && report.text.includes('cache')) {
          detail = `Loading from cache: ${Math.round(progress)}%`;
        }
        
        console.log(`Progress: ${progress}%, ${detail}`);
        this.updateProgress({ progress, detail });
        
        // Update status based on progress message
        if (detail?.includes('download')) {
          this.updateStatus('downloading');
        } else if (detail?.includes('load')) {
          this.updateStatus('loading');
        }
      };

      // Create a web worker with the proper handler
      this.worker = new Worker(new URL('./llm.worker.ts', import.meta.url), {
        type: 'module'
      });

      // Configure with caching and model setup
      const options = {
        initProgressCallback,
        useIndexedDB: true,
        cacheConfig: {
          useModelStore: true,
          forceCache: true,
        }
      };

      // Initialize the engine with models - using default WebLLM model list
      this.engine = await CreateWebWorkerMLCEngine(
        this.worker,
        [this.selectedModel],  // Only initialize our primary model
        options
      );

      this.isInitialized = true;
      this.isLoading = false;
      this.updateStatus('ready');
      
      // Save status to localStorage for future visits
      localStorage.setItem('llm_status', 'ready');
      localStorage.setItem('llm_selected_model', this.selectedModel);
      
      this.updateProgress({ progress: 100, detail: 'Models loaded successfully' });
      return true;
    } catch (error) {
      console.error("Failed to initialize LLM:", error);
      this.isLoading = false;
      this.updateStatus('error');
      return false;
    }
  }

  async chatStream(message: string): Promise<AsyncIterable<ChatCompletionChunk>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.engine) {
        throw new Error("LLM engine not initialized");
      }

      // Prepare messages with system prompt
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemPrompt } as ChatCompletionSystemMessageParam,
        { role: "user", content: message } as ChatCompletionUserMessageParam
      ];

      // Create streaming request with max tokens limit to keep responses short
      const request: ChatCompletionRequestStreaming = {
        model: this.selectedModel, // Specify which model to use
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 50 // Limit the response length to keep it brief
      };

      // Get the completion stream
      return await this.engine.chat.completions.create(request);
    } catch (error) {
      console.error("Error in chat stream:", error);
      // Return a mock stream if there's an error
      return this.createFallbackStream(message);
    }
  }

  async chat(message: string): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.engine) {
        throw new Error("LLM engine not initialized");
      }

      // Prepare messages with system prompt
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemPrompt } as ChatCompletionSystemMessageParam,
        { role: "user", content: message } as ChatCompletionUserMessageParam
      ];

      // Create non-streaming request with max tokens limit
      const request: ChatCompletionRequestNonStreaming = {
        model: this.selectedModel, // Specify which model to use
        messages: messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 50 // Limit the response length to keep it brief
      };

      // Get the completion
      const result = await this.engine.chat.completions.create(request);
      
      // Return the assistant's response
      const assistantMessage = result.choices[0].message.content;
      return assistantMessage || "";
    } catch (error) {
      console.error("Error in chat:", error);
      // Return a fallback response if there's an error
      return this.getFallbackResponse(message);
    }
  }

  // Method to generate a completion from an array of messages
  async generateCompletion(messages: Array<{role: string, content: string}>): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.engine) {
        throw new Error("LLM engine not initialized");
      }

      // Convert messages to the format expected by the API
      const convertedMessages: ChatCompletionMessageParam[] = messages.map(msg => {
        if (msg.role === "system") {
          return { 
            role: "system", 
            // Always ensure the system prompt enforces brevity
            content: msg.content + " Be extremely concise. Limit your response to 1-2 sentences maximum."
          } as ChatCompletionSystemMessageParam;
        } else if (msg.role === "user") {
          return { role: "user", content: msg.content } as ChatCompletionUserMessageParam;
        } else {
          return { role: "assistant", content: msg.content } as ChatCompletionAssistantMessageParam;
        }
      });

      // Create non-streaming request with max tokens limit
      const request: ChatCompletionRequestNonStreaming = {
        model: this.selectedModel, // Specify which model to use
        messages: convertedMessages,
        stream: false,
        temperature: 0.7,
        max_tokens: 50 // Limit the response length to keep it brief
      };

      // Get the completion
      const result = await this.engine.chat.completions.create(request);
      
      // Return the assistant's response
      const assistantMessage = result.choices[0].message.content;
      return assistantMessage || "";
    } catch (error) {
      console.error("Error generating completion:", error);
      // Return a fallback response if there's an error
      return this.getFallbackResponse(messages[messages.length - 1]?.content || "");
    }
  }

  // Change the selected model
  public async setModel(modelId: string): Promise<void> {
    if (this.selectedModel === modelId && this.status === 'ready') return;
    
    if (!modelOptions.some(model => model.id === modelId)) {
      console.error(`Invalid model ID: ${modelId}`);
      return;
    }
    
    this.selectedModel = modelId;
    console.log(`Switched to model: ${modelId}`);
    localStorage.setItem('llm_selected_model', modelId);
    
    // No need to reinitialize since we loaded both models at startup
    // Just update the UI if needed
    if (this.status !== 'ready') {
      await this.initialize();
    }
  }

  // Register listeners for status updates
  public onStatusChange(callback: (status: LLMStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status); // Call immediately with current status
    
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  // Register listeners for progress updates
  public onProgressChange(callback: (progress: ProgressUpdate) => void): () => void {
    this.progressListeners.push(callback);
    callback(this.progress); // Call immediately with current progress
    
    return () => {
      this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
    };
  }

  // Get current status
  public getStatus(): LLMStatus {
    return this.status;
  }

  // Get current progress
  public getProgress(): ProgressUpdate {
    return this.progress;
  }

  // Get the current model ID
  public getCurrentModel(): string {
    // Try to load from localStorage first
    const savedModel = localStorage.getItem('llm_selected_model');
    if (savedModel && modelOptions.some(model => model.id === savedModel)) {
      this.selectedModel = savedModel;
    }
    return this.selectedModel;
  }

  // Update status and notify listeners
  private updateStatus(status: LLMStatus): void {
    this.status = status;
    this.statusListeners.forEach(callback => callback(status));
  }

  // Update progress and notify listeners
  private updateProgress(progress: ProgressUpdate): void {
    this.progress = progress;
    this.progressListeners.forEach(callback => callback(progress));
  }

  // Cleanup resources when component unmounts or page is closed
  private cleanup = (): void => {
    try {
      console.log('Cleaning up LLM resources...');
      
      // Terminate the worker if it exists
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      
      // Clear engine reference
      this.engine = null;
      
      // We don't actually unload the model from IndexedDB since we want to cache it
      // for future visits, but we do clean up the memory usage
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // Call this method when the application is shutting down
  public dispose(): void {
    window.removeEventListener('beforeunload', this.cleanup);
    this.cleanup();
  }

  // Provides a fallback response when the LLM fails to respond
  private getFallbackResponse(message: string): string {
    const content = message.toLowerCase();
    
    if (content.includes("experience")) {
      return "Tell me about your most relevant experience. What specific skills did you develop there?";
    } else if (content.includes("strength")) {
      return "What's your greatest technical strength? Can you give a specific example?";
    } else if (content.includes("weakness")) {
      return "Tell me about an area you're improving. How are you addressing it?";
    } else if (content.includes("challenge")) {
      return "Describe a challenging project. How did you overcome the obstacles?";
    } else if (content.includes("salary") || content.includes("compensation")) {
      return "What are your salary expectations? How did you arrive at that figure?";
    } else if (content.length < 20) {
      return "Introduce yourself?";
    } else {
      return "Interesting. Can you elaborate with a specific example?";
    }
  }

  // Create a fallback stream for when chatStream fails
  private createFallbackStream(message: string): AsyncIterable<ChatCompletionChunk> {
    const fallbackResponse = this.getFallbackResponse(message);
    const words = fallbackResponse.split(" ");
    
    return {
      [Symbol.asyncIterator]: async function* () {
        for (const word of words) {
          yield { choices: [{ delta: { content: word + " " } }] } as ChatCompletionChunk;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance(); 