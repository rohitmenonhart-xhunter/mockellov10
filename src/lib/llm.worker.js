// Web worker for LLM simulation
// This is a simplified fallback worker without direct WebLLM imports

// Let the main thread know the worker is ready
self.postMessage({ type: 'ready' });

// Handle messages from the main thread
self.onmessage = async (event) => {
  try {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'initialize':
        // Simulate initialization and progress
        await simulateModelLoading();
        break;
        
      case 'generate':
        // Generate a simulated response based on the messages
        const { messages } = payload;
        const response = generateResponse(messages);
        
        // Send back the completion
        self.postMessage({
          type: 'generated',
          result: response
        });
        break;
        
      case 'stream':
        // Simulate a streaming response
        const { streamMessages } = payload;
        await simulateStreamingResponse(streamMessages);
        break;
        
      default:
        self.postMessage({
          type: 'error',
          message: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

// Simulate model loading with progress updates
async function simulateModelLoading() {
  // Simulate downloading
  for (let i = 0; i <= 100; i += 10) {
    self.postMessage({
      type: 'progress',
      progress: i,
      detail: `Downloading model: ${i}%`
    });
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Simulate loading
  for (let i = 0; i <= 100; i += 20) {
    self.postMessage({
      type: 'progress',
      progress: i,
      detail: `Loading model: ${i}%`
    });
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  // Notify initialization complete
  self.postMessage({ type: 'initialized' });
}

// Generate a response based on the content of messages
function generateResponse(messages) {
  // Get the last user message
  const lastUserMessage = findLastUserMessage(messages);
  if (!lastUserMessage) return "I don't understand. Could you rephrase your question?";
  
  const content = lastUserMessage.content.toLowerCase();
  
  // Interview related responses
  if (content.includes('experience') || content.includes('work history')) {
    return "When discussing your experience, focus on specific achievements and quantifiable results. Can you share a project where you had significant impact?";
  } else if (content.includes('strength') || content.includes('good at')) {
    return "Great question about strengths. Focus on 2-3 key technical or soft skills that are most relevant to the role. Can you provide specific examples that demonstrate these strengths?";
  } else if (content.includes('weakness') || content.includes('improve')) {
    return "When discussing areas for improvement, show self-awareness and focus on steps you're taking to address them. Choose a weakness that isn't critical to the role, and emphasize your growth mindset.";
  } else if (content.includes('challenge') || content.includes('difficult')) {
    return "When describing challenges, use the STAR method: Situation, Task, Action, Result. This structure helps you tell a compelling story about how you overcome obstacles.";
  } else if (content.includes('salary') || content.includes('compensation')) {
    return "For salary discussions, research industry standards beforehand. It's usually best to provide a range rather than a specific number, and emphasize that you're flexible and more interested in the overall opportunity.";
  } else if (content.includes('why') && (content.includes('this role') || content.includes('this company'))) {
    return "When explaining why you want the role, show you've researched the company. Connect your skills and aspirations to their mission and the specific responsibilities in the job description.";
  } else if (content.includes('tell me about yourself') || content.includes('introduce yourself')) {
    return "Your 'tell me about yourself' response should be a 60-90 second overview that highlights your relevant experience, skills, and why you're interested in this role. Think of it as your professional story that leads naturally to why you're the right fit.";
  }
  
  // Default response
  return "That's an interesting question. In an interview, it's important to provide specific examples and quantifiable results when possible. Could you share more context about the situation you're preparing for?";
}

// Simulate streaming a response chunk by chunk
async function simulateStreamingResponse(messages) {
  const response = generateResponse(messages);
  const words = response.split(' ');
  
  // Send each word as a separate chunk with a delay
  for (const word of words) {
    self.postMessage({
      type: 'stream-chunk',
      chunk: word + ' '
    });
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  }
  
  // Signal end of stream
  self.postMessage({ type: 'stream-end' });
}

// Helper function to find the last user message
function findLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }
  return null;
} 