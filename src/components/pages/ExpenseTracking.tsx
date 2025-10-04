
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Receipt, TrendingDown } from "lucide-react";

type Expense = {
  id: string;
  propertyId: string;
  propertyName: string;
  date: string;
  category: string;
  description: string;
  amount: number;
};

type Property = {
  id: string;
  name: string;
  address: string;
};

const expenseSchema = z.object({
  propertyId: z.string().min(1, "Property selection is required"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

const EXPENSE_CATEGORIES = [
  "Maintenance",
  "Utilities",
  "Taxes",
  "Insurance",
  "Management Fees",
  "Supplies",
  "Repairs",
  "Cleaning",
  "Legal & Professional",
  "Advertising",
  "Other",
];

const ExpenseTracking = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      propertyId: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      amount: 0,
    },
  });

  useEffect(() => {
    const loadData = () => {
      try {
        const storedExpenses = localStorage.getItem("rental_expenses");
        const storedProperties = localStorage.getItem("rental_properties");
        
        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        }
        if (storedProperties) {
          setProperties(JSON.parse(storedProperties));
        }
      } catch (error) {
        console.error("Failed to load data from localStorage", error);
        toast.error("Could not load data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveExpenses = (updatedExpenses: Expense[]) => {
    try {
      setExpenses(updatedExpenses);
      localStorage.setItem("rental_expenses", JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error("Failed to save expenses", error);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : "Unknown Property";
  };

  const handleOpenDialog = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.reset({
        propertyId: expense.propertyId,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
      });
    } else {
      form.reset({
        propertyId: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
        description: "",
        amount: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    try {
      const propertyName = getPropertyName(values.propertyId);
      
      if (editingExpense) {
        const updatedExpenses = expenses.map((exp) =>
          exp.id === editingExpense.id 
            ? { ...exp, ...values, propertyName } 
            : exp
        );
        saveExpenses(updatedExpenses);
        toast.success("Expense updated successfully!");
      } else {
        const newExpense: Expense = {
          id: crypto.randomUUID(),
          propertyId: values.propertyId,
          propertyName,
          date: values.date,
          category: values.category,
          description: values.description,
          amount: values.amount,
        };
        saveExpenses([...expenses, newExpense]);
        toast.success("Expense added successfully!");
      }
      setIsDialogOpen(false);
      setEditingExpense(null);
      form.reset({
        propertyId: "",
        date: new Date().toISOString().split("T")[0],
        category: "",
        description: "",
        amount: 0,
      });
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  const handleDelete = (id: string) => {
    toast("Are you sure you want to delete this expense?", {
      action: {
        label: "Delete",
        onClick: () => {
          try {
            const updatedExpenses = expenses.filter((exp) => exp.id !== id);
            saveExpenses(updatedExpenses);
            toast.success("Expense deleted successfully.");
          } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense. Please try again.");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      }
    });
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="h-8 w-8 text-orange-600" />
            Expense Tracking
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage all your property-related expenses</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-orange-600 hover:bg-orange-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-orange-600">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">₹{thisMonthExpenses.toLocaleString()}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-green-600">{expenses.length}</p>
              </div>
              <Edit className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update the details of your expense." : "Add a new expense to your records."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map(property => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {EXPENSE_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Replaced kitchen faucet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g. 5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingExpense ? "Update" : "Save"} Expense
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50">
                    <TableCell>{new Date(expense.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-medium">{expense.propertyName}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right font-semibold">₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)} className="mr-1">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No expenses recorded yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start tracking your property expenses by adding your first record.</p>
              <Button onClick={() => handleOpenDialog()} className="bg-orange-600 hover:bg-orange-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Add First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracking;
