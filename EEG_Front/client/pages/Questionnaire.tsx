import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Brain, ArrowLeft, ArrowRight, CheckCircle, FileText } from "lucide-react";

interface Question {
  id: string;
  category: string;
  question: string;
  options: { value: string; label: string; points: number }[];
}

const questions: Question[] = [
  {
    id: "orientation-1",
    category: "Orientation",
    question: "What year is it?",
    options: [
      { value: "correct", label: "2024", points: 1 },
      { value: "close", label: "2023 or 2025", points: 0 },
      { value: "incorrect", label: "Other year", points: 0 }
    ]
  },
  {
    id: "orientation-2",
    category: "Orientation",
    question: "What season is it?",
    options: [
      { value: "correct", label: "Current season", points: 1 },
      { value: "incorrect", label: "Different season", points: 0 }
    ]
  },
  {
    id: "attention-1",
    category: "Attention",
    question: "I will say three words. Please repeat them: Apple, Table, Penny",
    options: [
      { value: "all-three", label: "All three words correct", points: 3 },
      { value: "two", label: "Two words correct", points: 2 },
      { value: "one", label: "One word correct", points: 1 },
      { value: "none", label: "No words correct", points: 0 }
    ]
  },
  {
    id: "calculation-1",
    category: "Calculation",
    question: "What is 100 minus 7?",
    options: [
      { value: "93", label: "93", points: 1 },
      { value: "other", label: "Other answer", points: 0 }
    ]
  },
  {
    id: "calculation-2",
    category: "Calculation",
    question: "Continue subtracting 7: 93 minus 7?",
    options: [
      { value: "86", label: "86", points: 1 },
      { value: "other", label: "Other answer", points: 0 }
    ]
  },
  {
    id: "recall-1",
    category: "Recall",
    question: "Can you recall the three words I mentioned earlier? (Apple, Table, Penny)",
    options: [
      { value: "all-three", label: "All three words", points: 3 },
      { value: "two", label: "Two words", points: 2 },
      { value: "one", label: "One word", points: 1 },
      { value: "none", label: "No words", points: 0 }
    ]
  },
  {
    id: "language-1",
    category: "Language",
    question: "What do you call this object? (Point to a watch)",
    options: [
      { value: "watch", label: "Watch/Timepiece", points: 1 },
      { value: "other", label: "Other answer", points: 0 }
    ]
  },
  {
    id: "language-2",
    category: "Language",
    question: "What do you call this object? (Point to a pencil)",
    options: [
      { value: "pencil", label: "Pencil", points: 1 },
      { value: "other", label: "Other answer", points: 0 }
    ]
  },
  {
    id: "executive-1",
    category: "Executive Function",
    question: "Can you draw a clock showing 3:30?",
    options: [
      { value: "perfect", label: "Perfect clock with correct time", points: 3 },
      { value: "good", label: "Minor errors but recognizable", points: 2 },
      { value: "poor", label: "Major errors", points: 1 },
      { value: "unable", label: "Unable to complete", points: 0 }
    ]
  },
  {
    id: "visuospatial-1",
    category: "Visuospatial",
    question: "Can you copy this cube design? (Show intersecting pentagons)",
    options: [
      { value: "perfect", label: "Accurate copy", points: 1 },
      { value: "poor", label: "Recognizable but with errors", points: 0 },
      { value: "unable", label: "Unable to complete", points: 0 }
    ]
  }
];

export default function Questionnaire() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;
    
    questions.forEach(question => {
      const answer = answers[question.id];
      const selectedOption = question.options.find(opt => opt.value === answer);
      if (selectedOption) {
        totalScore += selectedOption.points;
      }
      maxScore += Math.max(...question.options.map(opt => opt.points));
    });
    
    return { totalScore, maxScore, percentage: Math.round((totalScore / maxScore) * 100) };
  };

  const getScoreInterpretation = (percentage: number) => {
    if (percentage >= 90) return { level: "Excellent", color: "text-green-600", description: "Cognitive function appears normal" };
    if (percentage >= 75) return { level: "Good", color: "text-green-500", description: "Minor areas for attention" };
    if (percentage >= 60) return { level: "Fair", color: "text-yellow-600", description: "Some cognitive concerns detected" };
    return { level: "Concerning", color: "text-red-600", description: "Recommend professional evaluation" };
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ?.id];

  if (showResults) {
    const { totalScore, maxScore, percentage } = calculateScore();
    const interpretation = getScoreInterpretation(percentage);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/results">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Results
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Cognitive Test Results</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Cognitive Assessment Complete</CardTitle>
              <CardDescription className="text-lg">
                Your cognitive screening test has been completed and scored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {totalScore}/{maxScore}
                    </div>
                    <div className="text-2xl font-semibold text-foreground mb-1">
                      {percentage}%
                    </div>
                    <Badge variant="outline" className={interpretation.color}>
                      {interpretation.level}
                    </Badge>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">Score Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Orientation</span>
                        <span>2/2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attention</span>
                        <span>3/3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calculation</span>
                        <span>2/2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recall</span>
                        <span>3/3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language</span>
                        <span>2/2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Executive Function</span>
                        <span>3/3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Visuospatial</span>
                        <span>1/1</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">Interpretation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {interpretation.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This screening test provides a general assessment of cognitive function. 
                      It should not be used as a diagnostic tool. Please consult with a healthcare 
                      professional for comprehensive evaluation.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => window.print()}>
                      <FileText className="h-4 w-4 mr-2" />
                      Print Results
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/results">
                        View EEG Results
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/assessment">
                        Take New Assessment
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/results">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">Cognitive Screening Test</span>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary">{currentQ.category}</Badge>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1}
              </span>
            </div>
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
            <CardDescription>
              Please select the most appropriate answer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={answers[currentQ.id] || ""} 
              onValueChange={(value) => handleAnswer(currentQ.id, value)}
            >
              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value}
                      className="text-sm cursor-pointer flex-1 py-2"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={nextQuestion}
            disabled={!isAnswered}
          >
            {currentQuestion === questions.length - 1 ? (
              <>
                View Results
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
