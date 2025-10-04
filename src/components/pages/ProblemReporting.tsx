
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface Problem {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  reportedDate: string;
  resolvedDate?: string;
  reportedBy: string;
}

interface Property {
  id: string;
  name: string;
}

const ProblemReporting = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [formData, setFormData] = useState({
    propertyId: '',
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    reportedBy: ''
  });

  useEffect(() => {
    const savedProblems = localStorage.getItem('rental_problems');
    const savedProperties = localStorage.getItem('rental_properties');
    
    if (savedProblems) setProblems(JSON.parse(savedProblems));
    if (savedProperties) setProperties(JSON.parse(savedProperties));
  }, []);

  const saveProblems = (updatedProblems: Problem[]) => {
    localStorage.setItem('rental_problems', JSON.stringify(updatedProblems));
    setProblems(updatedProblems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const problemData: Problem = {
      id: editingProblem?.id || Date.now().toString(),
      propertyId: formData.propertyId,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'Open',
      reportedDate: new Date().toISOString(),
      reportedBy: formData.reportedBy
    };

    let updatedProblems;
    if (editingProblem) {
      updatedProblems = problems.map(p => 
        p.id === editingProblem.id 
          ? { ...problemData, status: editingProblem.status, resolvedDate: editingProblem.resolvedDate }
          : p
      );
      toast({ title: "Problem updated successfully!" });
    } else {
      updatedProblems = [...problems, problemData];
      toast({ title: "Problem reported successfully!" });
    }

    saveProblems(updatedProblems);
    resetForm();
    setIsAddDialogOpen(false);
    setEditingProblem(null);
  };

  const resetForm = () => {
    setFormData({
      propertyId: '',
      title: '',
      description: '',
      priority: 'Medium',
      reportedBy: ''
    });
  };

  const updateProblemStatus = (problemId: string, newStatus: 'Open' | 'In Progress' | 'Resolved') => {
    const updatedProblems = problems.map(p => {
      if (p.id === problemId) {
        return {
          ...p,
          status: newStatus,
          resolvedDate: newStatus === 'Resolved' ? new Date().toISOString() : undefined
        };
      }
      return p;
    });
    
    saveProblems(updatedProblems);
    toast({ title: `Problem status updated to ${newStatus}` });
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      propertyId: problem.propertyId,
      title: problem.title,
      description: problem.description,
      priority: problem.priority,
      reportedBy: problem.reportedBy
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this problem report?')) {
      const updatedProblems = problems.filter(p => p.id !== id);
      saveProblems(updatedProblems);
      toast({ title: "Problem report deleted successfully!" });
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProblems = problems.filter(problem => 
    filterStatus === 'All' || problem.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Problem Reporting</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              ➕ Report Problem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProblem ? 'Edit Problem Report' : 'Report New Problem'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="property">Property</Label>
                <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Problem Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the problem"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about the problem"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Critical') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reportedBy">Reported By</Label>
                <Input
                  id="reportedBy"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
                  placeholder="Your name or tenant name"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  {editingProblem ? 'Update' : 'Report'} Problem
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingProblem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex space-x-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems
          .sort((a, b) => {
            // Sort by priority (Critical, High, Medium, Low) then by date
            const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime();
          })
          .map((problem) => (
            <Card key={problem.id} className={`${
              problem.priority === 'Critical' ? 'border-red-500 bg-red-50' : ''
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{problem.title}</CardTitle>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(problem.priority)}`}>
                      {problem.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                      {problem.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">{problem.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="space-y-1">
                      <p>🏠 <strong>Property:</strong> {getPropertyName(problem.propertyId)}</p>
                      <p>👤 <strong>Reported by:</strong> {problem.reportedBy}</p>
                      <p>📅 <strong>Date:</strong> {new Date(problem.reportedDate).toLocaleDateString()}</p>
                      {problem.resolvedDate && (
                        <p>✅ <strong>Resolved:</strong> {new Date(problem.resolvedDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(problem)}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={problem.status === 'Open' ? 'default' : 'outline'}
                      onClick={() => updateProblemStatus(problem.id, 'Open')}
                    >
                      🔓 Open
                    </Button>
                    <Button
                      size="sm"
                      variant={problem.status === 'In Progress' ? 'default' : 'outline'}
                      onClick={() => updateProblemStatus(problem.id, 'In Progress')}
                    >
                      🔧 In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={problem.status === 'Resolved' ? 'default' : 'outline'}
                      onClick={() => updateProblemStatus(problem.id, 'Resolved')}
                    >
                      ✅ Resolved
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(problem.id)}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Problem Reports</h3>
          <p className="text-gray-500">All properties are in good condition, or start reporting issues to track them.</p>
        </div>
      )}
    </div>
  );
};

export default ProblemReporting;
