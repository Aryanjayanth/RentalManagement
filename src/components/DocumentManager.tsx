
import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: 'lease' | 'insurance' | 'inspection' | 'other';
  propertyName?: string;
  tenantId?: string;
  propertyId?: string;
  uploadDate: string;
  size: string;
  url: string; // In a real app, this would be a file URL
}

interface Property {
  id: string;
  name: string;
  address?: string;
  // Add other property fields as needed
}

interface DocumentManagerProps {
  tenantId?: string;
  propertyId?: string;
  properties?: Property[]; // Add properties prop
}

export const DocumentManager = ({ tenantId, propertyId }: DocumentManagerProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    // Load properties from localStorage
    const savedProperties = localStorage.getItem('rental_properties');
    if (savedProperties) {
      const parsedProperties = JSON.parse(savedProperties);
      // Map to the expected Property format
      const formattedProperties = parsedProperties.map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address
      }));
      setProperties(formattedProperties);
    }
  }, []);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'other' as const,
    file: null as File | null
  });

  useEffect(() => {
    const savedDocs = localStorage.getItem('rental_documents');
    if (savedDocs) {
      const allDocs = JSON.parse(savedDocs);
      // Filter documents based on tenant or property
      const filteredDocs = allDocs.filter((doc: Document) => {
        if (tenantId) return doc.tenantId === tenantId;
        if (propertyId) return doc.propertyId === propertyId;
        return true; // Show all if no specific filter
      });
      setDocuments(filteredDocs);
    }
  }, [tenantId, propertyId]);

  const saveDocuments = (docs: Document[]) => {
    const allDocs = JSON.parse(localStorage.getItem('rental_documents') || '[]');
    // Update or add documents
    const updatedDocs = [...allDocs];
    docs.forEach(doc => {
      const existingIndex = updatedDocs.findIndex(d => d.id === doc.id);
      if (existingIndex >= 0) {
        updatedDocs[existingIndex] = doc;
      } else {
        updatedDocs.push(doc);
      }
    });
    localStorage.setItem('rental_documents', JSON.stringify(updatedDocs));
    setDocuments(docs);
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.name) {
      toast({
        title: "Error",
        description: "Please provide a file name and select a file",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPropertyId) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive"
      });
      return;
    }
    
    // Get the selected property
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    
    if (!selectedProperty) {
      toast({
        title: "Error",
        description: "Selected property not found",
        variant: "destructive"
      });
      return;
    }

    // Simulate file upload - in real app, you'd upload to cloud storage
    const newDocument: Document = {
      id: Date.now().toString(),
      name: uploadForm.name,
      type: uploadForm.type,
      propertyName: selectedProperty.name,
      propertyId: selectedProperty.id,
      tenantId: tenantId,
      uploadDate: new Date().toISOString(),
      size: uploadForm.file ? `${(uploadForm.file.size / 1024).toFixed(1)} KB` : '0 KB',
      url: uploadForm.file ? URL.createObjectURL(uploadForm.file) : '' // Temporary URL for demo
    };

    const updatedDocs = [...documents, newDocument];
    saveDocuments(updatedDocs);
    
    setUploadForm({ name: '', type: 'other', file: null });
    setSelectedPropertyId('');
    setIsUploadOpen(false);
    
    toast({
      title: "Success",
      description: "Document uploaded successfully"
    });
  };

  const deleteDocument = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const updatedDocs = documents.filter(doc => doc.id !== id);
      saveDocuments(updatedDocs);
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lease': return 'bg-blue-50 text-blue-600';
      case 'insurance': return 'bg-green-50 text-green-600';
      case 'inspection': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents</span>
          </CardTitle>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="docName">Document Name</Label>
                  <Input
                    id="docName"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter document name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="docType">Document Type</Label>
                  <Select value={uploadForm.type} onValueChange={(value: any) => setUploadForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lease">Lease Agreement</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="inspection">Inspection Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="property">Select Property</Label>
                  {properties.length > 0 ? (
                    <Select 
                      value={selectedPropertyId} 
                      onValueChange={setSelectedPropertyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                              <div className="truncate">
                                <div className="font-medium">{property.name}</div>
                                {property.address && (
                                  <div className="text-xs text-muted-foreground truncate">{property.address}</div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                      No properties found. Please add properties first.
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">Upload</Button>
                  <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(doc.type)}
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(doc.type)}`}>
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                      </span>
                      {doc.propertyName && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                          {doc.propertyName}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{doc.size}</span>
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const link = document.createElement('a');
                    link.href = doc.url;
                    link.download = doc.name;
                    link.click();
                  }}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteDocument(doc.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
