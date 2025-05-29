import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InterviewConfig {
  role: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  customRole?: string;
}

interface InterviewConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: InterviewConfig) => void;
}

const PREDEFINED_ROLES = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
  "Marketing Specialist",
  "Sales Representative",
  "Financial Analyst",
  "Project Manager",
  "Customer Success Manager",
  "Custom Role"
];

export function InterviewConfigModal({ isOpen, onClose, onSave }: InterviewConfigModalProps) {
  const [config, setConfig] = useState<InterviewConfig>({
    role: PREDEFINED_ROLES[0],
    difficulty: "intermediate",
    customRole: ""
  });

  const handleRoleChange = (role: string) => {
    setConfig(prev => ({ ...prev, role }));
  };

  const handleDifficultyChange = (difficulty: "beginner" | "intermediate" | "advanced") => {
    setConfig(prev => ({ ...prev, difficulty }));
  };

  const handleCustomRoleChange = (customRole: string) => {
    setConfig(prev => ({ ...prev, customRole }));
  };

  const handleSave = () => {
    // If custom role is selected, use the custom role value
    const finalConfig = {
      ...config,
      role: config.role === "Custom Role" ? config.customRole : config.role
    };
    
    onSave(finalConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Configure Your Interview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Select value={config.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_ROLES.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Custom Role Input (shown only when Custom Role is selected) */}
          {config.role === "Custom Role" && (
            <div className="space-y-2">
              <Label htmlFor="customRole">Specify Role</Label>
              <Input 
                id="customRole"
                value={config.customRole}
                onChange={(e) => handleCustomRoleChange(e.target.value)}
                placeholder="Enter your target role"
                className="w-full"
              />
            </div>
          )}
          
          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select 
              value={config.difficulty} 
              onValueChange={(value) => handleDifficultyChange(value as "beginner" | "intermediate" | "advanced")}
            >
              <SelectTrigger id="difficulty" className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {config.difficulty === "beginner" && "Entry-level questions with helpful guidance"}
              {config.difficulty === "intermediate" && "Standard interview questions with moderate complexity"}
              {config.difficulty === "advanced" && "Challenging questions for experienced candidates"}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
          <Button onClick={handleSave}>Start Interview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 