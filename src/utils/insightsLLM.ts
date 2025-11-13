// Mock LLM service for Insights generation and updates

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

export interface GenerateInsightParams {
  prompt: string;
  sampleFile?: UploadedFile;
  informationalFiles?: UploadedFile[];
  includeWebSources?: boolean;
}

export interface UpdateInsightParams {
  originalText: string;
  prompt: string;
  sampleFile?: UploadedFile;
  informationalFiles?: UploadedFile[];
  includeWebSources?: boolean;
  editType?: 'grammar' | 'shorter' | 'longer' | 'tone';
}

// Mock insight generation
export async function generateInsight(
  params: GenerateInsightParams
): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { prompt, sampleFile, informationalFiles, includeWebSources } = params;

  let insight = `Based on your request: "${prompt}"\n\n`;

  if (sampleFile) {
    insight += `[Note: Using style and tone from ${sampleFile.name}]\n\n`;
  }

  if (informationalFiles && informationalFiles.length > 0) {
    const fileNames = informationalFiles.map(f => f.name).join(', ');
    insight += `[Note: Incorporating data from ${fileNames}]\n\n`;
  }

  if (includeWebSources) {
    insight += `[Note: Including information from web sources]\n\n`;
  }

  // Generate mock insight content
  insight += `This is a generated insight that addresses your prompt. The insight provides comprehensive analysis and recommendations based on the available information sources. `;
  
  if (informationalFiles && informationalFiles.length > 0) {
    insight += `Key data points from the attached files have been integrated to support the conclusions. `;
  }
  
  if (sampleFile) {
    insight += `The writing style and structure follow the format of the provided sample. `;
  }

  insight += `\n\nThe insight covers multiple aspects of the topic, providing both strategic overview and actionable recommendations. `;
  insight += `It synthesizes information from various sources to create a cohesive narrative that addresses the core question or objective.`;

  return insight;
}

// Mock insight update
export async function updateInsight(
  params: UpdateInsightParams
): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { originalText, prompt, sampleFile, informationalFiles, includeWebSources, editType } = params;

  let updatedText = originalText;

  // Handle different edit types
  if (editType === 'grammar') {
    // Simulate grammar improvements
    updatedText = originalText
      .replace(/\bi\b/g, 'I')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bwon't\b/g, 'will not');
  } else if (editType === 'shorter') {
    // Simulate shortening by removing some sentences
    const sentences = originalText.split(/[.!?]+/).filter(s => s.trim());
    updatedText = sentences.slice(0, Math.max(1, Math.floor(sentences.length * 0.7))).join('. ') + '.';
  } else if (editType === 'longer') {
    // Simulate lengthening by adding content
    updatedText = originalText + ' This additional context provides more depth and detail to the insight. Further analysis reveals additional considerations that enhance the overall understanding.';
  } else if (editType === 'tone') {
    // Simulate tone change
    updatedText = originalText.replace(/\./g, '!').replace(/\bcan\b/g, 'will');
  } else {
    // Regular update based on prompt
    if (prompt.toLowerCase().includes('add') || prompt.toLowerCase().includes('include')) {
      updatedText = originalText + `\n\n[Additional content based on: "${prompt}"]`;
    } else if (prompt.toLowerCase().includes('remove') || prompt.toLowerCase().includes('delete')) {
      const sentences = originalText.split(/[.!?]+/).filter(s => s.trim());
      updatedText = sentences.slice(0, -1).join('. ') + '.';
    } else if (prompt.toLowerCase().includes('change') || prompt.toLowerCase().includes('update')) {
      updatedText = originalText.replace(/insight/g, 'analysis').replace(/recommendation/g, 'suggestion');
    } else {
      // Default: add content at the end
      updatedText = originalText + `\n\n[Updated based on: "${prompt}"]`;
    }
  }

  if (sampleFile) {
    updatedText += `\n\n[Style updated to match ${sampleFile.name}]`;
  }

  if (informationalFiles && informationalFiles.length > 0) {
    const fileNames = informationalFiles.map(f => f.name).join(', ');
    updatedText += `\n\n[Data updated from ${fileNames}]`;
  }

  if (includeWebSources) {
    updatedText += `\n\n[Web sources included]`;
  }

  return updatedText;
}

// Streaming version for real-time updates
export async function* streamInsightGeneration(
  params: GenerateInsightParams
): AsyncGenerator<string, void, unknown> {
  const fullInsight = await generateInsight(params);
  const words = fullInsight.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    yield words.slice(0, i + 1).join(' ');
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
  }
}

export async function* streamInsightUpdate(
  params: UpdateInsightParams
): AsyncGenerator<string, void, unknown> {
  const fullUpdate = await updateInsight(params);
  const words = fullUpdate.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    yield words.slice(0, i + 1).join(' ');
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
  }
}

