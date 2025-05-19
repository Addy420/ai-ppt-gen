import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Edit, Plus, Image, Save, Presentation as PresentationIcon } from 'lucide-react';
import { Presentation, SlideContent } from '@/services/presentationService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface PresentationViewProps {
  presentation: {
    result: string;
    source: string;
    slide: string;
  };
  title: string
  onEdit?: () => void;
  onCreateNew?: () => void;
  onSave?: (presentation: Presentation) => void;
}


const PresentationView: React.FC<PresentationViewProps> = ({
  title,
  presentation,
  onEdit,
  onCreateNew,
  onSave
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [processedPresentation, setProcessedPresentation] = useState<Presentation>({
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    title: title,  // Default title
    slides: [],
    result: presentation.result,
  });

  // Define the default title logic
  const defaultTitle = presentation.source && presentation.source !== 'gemini-api'
    ? presentation.source
    : title;

  // Process the raw text into slides
  useEffect(() => {
    const slideRegex = /\*\*Slide \d+: (.*?)\*\*\n\n\*\*Content:\*\*([\s\S]*?)(?=(\*\*Slide \d+:)|$)/g;

    const slides: SlideContent[] = [];
    let match;

    while ((match = slideRegex.exec(presentation.result)) !== null) {
      const [, rawTitle, rawContent] = match;

      slides.push({
        title: rawTitle.trim(),
        content: rawContent.trim(),
        imageUrl: "",
        style: {}
      });
    }

    setProcessedPresentation({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      title: defaultTitle,
      slides,
      result: presentation.result
    });
  }, [presentation.result, presentation.source]);


  const currentSlide = processedPresentation.slides[currentSlideIndex];

  const goToPreviousSlide = () => {
    setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex(prev => (
      prev < processedPresentation.slides.length - 1 ? prev + 1 : prev
    ));
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(processedPresentation));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download",
      `${processedPresentation.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (onSave) {
        onSave(processedPresentation);
        toast({
          title: "Changes saved",
          description: "Your presentation has been updated successfully",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const updateSlideContent = (field: keyof SlideContent, value: string) => {
    const updatedSlides = [...processedPresentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      [field]: value
    };

    setProcessedPresentation({
      ...processedPresentation,
      slides: updatedSlides
    });
  };

  const getSlideStyles = () => {
    const style = currentSlide.style || {};
    const inlineStyle: React.CSSProperties = {
      textAlign: style.alignment as any || 'left',
      color: style.textColor || '#333333',
    };

    if (style.gradient) {
      inlineStyle.background = style.gradient;
    } else if (style.backgroundColor) {
      inlineStyle.backgroundColor = style.backgroundColor;
    }

    if (style.fontSize === 'large') {
      inlineStyle.fontSize = '1.125rem';
    }

    return inlineStyle;
  };

  if (!processedPresentation.slides.length) {
    return <div>Loading presentation...</div>;
  }

  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PresentationIcon className="h-5 w-5 text-primary" />
            {isEditing ? (
              <Input
                value={processedPresentation.title}
                onChange={(e) => setProcessedPresentation(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="font-bold"
              />
            ) : (
              <span>{processedPresentation.title}</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {currentSlideIndex + 1} / {processedPresentation.slides.length}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="aspect-video rounded-lg border border-gray-200 flex flex-col items-center justify-center p-8 relative overflow-hidden"
          style={getSlideStyles()}
        >
          {currentSlide.imageUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title}
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
            </div>
          )}

          <div className="relative z-10 text-center w-full">
            {isEditing ? (
              <>
                <Input
                  value={currentSlide.title}
                  onChange={(e) => updateSlideContent('title', e.target.value)}
                  className="text-xl font-bold mb-4 bg-transparent border-dashed"
                />
                <Textarea
                  value={currentSlide.content}
                  onChange={(e) => updateSlideContent('content', e.target.value)}
                  className="min-h-[100px] bg-transparent border-dashed"
                />
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-4 px-4">{currentSlide.title}</h3>
                <div className="whitespace-pre-line">
                  {currentSlide.content.split('\n').map((line, i) => (
                    <p key={i} className="my-2">{line}</p>
                  ))}
                </div>
              </>
            )}

            {currentSlide.imageUrl && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" size="sm" className="flex items-center gap-1 opacity-70">
                  <Image className="h-3.5 w-3.5" />
                  AI-generated visuals
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousSlide}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-1">
            {processedPresentation.slides.map((_, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={`w-2 h-2 p-0 rounded-full ${index === currentSlideIndex ? 'bg-primary' : 'bg-gray-200'}`}
                onClick={() => setCurrentSlideIndex(index)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextSlide}
            disabled={currentSlideIndex === processedPresentation.slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button
          variant={isEditing ? "default" : "outline"}
          className="flex-1"
          onClick={handleEditToggle}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>

        <Button
          className="flex-1"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>

        {onCreateNew && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCreateNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PresentationView;
