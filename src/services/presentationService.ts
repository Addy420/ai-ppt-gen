import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
export interface PresentationRequest {
  title: string;
  content: string;
  apiKey: string;
  slideBySlide?: boolean;
}

export interface SlideContent {
  title: string;
  content: string;
  imageUrl?: string;
  style?: {
    backgroundColor?: string;
    gradient?: string;
    textColor?: string;
    fontSize?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}

export interface Presentation {
  id: string;
  title: string;
  createdAt: string;
  slides: SlideContent[];
  result: string
}


const API_BASE_URL = "http://localhost:5000"; // Replace with your backend URL

// Generate presentation using backend
export const generatePresentation = async (request: PresentationRequest): Promise<Presentation> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/presentation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: request.title,
        content: request.content,
        slideBySlide: request.slideBySlide ?? false,
        apiKey: request.apiKey,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Backend error response:", errText);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the presentation. Please try again later.",
        variant: "destructive",
      });
      throw new Error("Failed to generate presentation");
    }

    const data: { result: string; source: string; title:string } = await res.json();

    // --- Transform the backend result into the Presentation interface ---
const parseSlidesFromResult = (result: string): SlideContent[] => {
  const slideBlocks = result.split(/\*\*Slide \d+: (.*?)\*\*/g).filter(Boolean);
  const slides: SlideContent[] = [];

  for (let i = 0; i < slideBlocks.length; i += 2) {
    const title = slideBlocks[i].trim();
    const content = slideBlocks[i + 1]?.trim() || '';
    slides.push({ title, content });
  }

  return slides;
};

const slides = parseSlidesFromResult(data.result);

const presentation: Presentation = {
  id: uuidv4(),
  title: request.title,
  createdAt: new Date().toISOString(),
  slides: slides,
  result: data.result,
};

return presentation;


  } catch (error: any) {
    console.error("Frontend Error:", error);
    toast({
      title: "Generation Failed",
      description: error?.message || "Something went wrong while generating your presentation.",
      variant: "destructive",
    });
    throw new Error("Presentation generation failed.");
  }
};

// Utilities to save and load presentations from localStorage
export const getSavedPresentations = (): Presentation[] => {
  try {
    const savedPresentations = localStorage.getItem('saved_presentations');
    return savedPresentations ? JSON.parse(savedPresentations) : [];
  } catch (error) {
    console.error("Error retrieving saved presentations:", error);
    return [];
  }
};

export const savePresentation = (presentation: Presentation): void => {
  try {
    const presentations = getSavedPresentations();
    const existingIndex = presentations.findIndex(p => p.id === presentation.id);

    if (existingIndex >= 0) {
      presentations[existingIndex] = presentation; // Update existing presentation
    } else {
      presentations.push(presentation); // Add new presentation
    }

    localStorage.setItem('saved_presentations', JSON.stringify(presentations));
  } catch (error) {
    console.error("Error saving presentation:", error);
    toast({
      title: "Error",
      description: "Failed to save presentation",
      variant: "destructive",
    });
  }
};
