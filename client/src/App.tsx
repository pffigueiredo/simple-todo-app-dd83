import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isUsingStubData, setIsUsingStubData] = useState(false);

  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Stub data for demonstration when backend is not available
  const createStubTodo = (title: string, description: string | null | undefined): Todo => ({
    id: Date.now(), // Use timestamp as a simple ID
    title,
    description: description ?? null, // Convert undefined to null
    completed: false,
    created_at: new Date(),
    updated_at: new Date()
  });

  // Load todos from the backend with fallback to stub behavior
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setBackendError(null);
      const result = await trpc.getTodos.query();
      setTodos(result);
      setIsUsingStubData(false);
    } catch (error) {
      console.error('Failed to load todos:', error);
      setBackendError('Backend not fully implemented - using demo mode');
      setIsUsingStubData(true);
      // Start with some demo todos to show the interface
      setTodos([
        {
          id: 1,
          title: "Welcome to Todo Manager! 🎉",
          description: "This is a demo todo showing how the app works",
          completed: false,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          title: "Try adding a new todo above",
          description: "Click the Add Todo button to see it in action",
          completed: true,
          created_at: new Date(Date.now() - 86400000), // Yesterday
          updated_at: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load todos on component mount
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Handle creating a new todo with fallback to local state
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsCreating(true);
    try {
      if (isUsingStubData) {
        // Use local state when backend is not available
        const newTodo = createStubTodo(formData.title, formData.description);
        setTodos((prev: Todo[]) => [newTodo, ...prev]);
      } else {
        const newTodo = await trpc.createTodo.mutate(formData);
        setTodos((prev: Todo[]) => [newTodo, ...prev]);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
      // Fallback to local state if backend fails
      const newTodo = createStubTodo(formData.title, formData.description);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setIsUsingStubData(true);
      setBackendError('Backend not available - changes are local only');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle toggling todo completion status
  const handleToggleComplete = async (todo: Todo) => {
    try {
      if (isUsingStubData) {
        // Update local state when backend is not available
        setTodos((prev: Todo[]) => 
          prev.map((t: Todo) => 
            t.id === todo.id 
              ? { ...t, completed: !t.completed, updated_at: new Date() }
              : t
          )
        );
      } else {
        const updatedTodo = await trpc.updateTodo.mutate({
          id: todo.id,
          completed: !todo.completed
        });
        
        if (updatedTodo) {
          setTodos((prev: Todo[]) => 
            prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
          );
        }
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      // Fallback to local state if backend fails
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => 
          t.id === todo.id 
            ? { ...t, completed: !t.completed, updated_at: new Date() }
            : t
        )
      );
      setIsUsingStubData(true);
      setBackendError('Backend not available - changes are local only');
    }
  };

  // Handle deleting a todo
  const handleDeleteTodo = async (todoId: number) => {
    try {
      if (isUsingStubData) {
        // Update local state when backend is not available
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      } else {
        const success = await trpc.deleteTodo.mutate({ id: todoId });
        if (success) {
          setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
        }
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Fallback to local state if backend fails
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      setIsUsingStubData(true);
      setBackendError('Backend not available - changes are local only');
    }
  };

  // Statistics
  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          
          {/* Statistics */}
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="px-3 py-1">
              Total: {totalCount}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Completed: {completedCount}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Remaining: {totalCount - completedCount}
            </Badge>
          </div>
        </div>

        {/* Backend Status Alert */}
        {backendError && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Demo Mode:</strong> {backendError}. The app is fully functional but changes won't persist after refresh.
            </AlertDescription>
          </Alert>
        )}

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <Input
                  placeholder="What needs to be done? 🎯"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="text-lg"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add a description... (optional)"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTodoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : '➕ Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet!</h3>
                <p className="text-gray-500">Create your first todo above to get started.</p>
              </CardContent>
            </Card>
          ) : (
            todos.map((todo: Todo) => (
              <Card key={todo.id} className={`shadow-md transition-all hover:shadow-lg ${todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      className="mt-1 flex-shrink-0 transition-all hover:scale-110"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Todo Content */}
                    <div className="flex-grow">
                      <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`mt-2 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>Created: {todo.created_at.toLocaleDateString()}</span>
                        {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                          <span>Updated: {todo.updated_at.toLocaleDateString()}</span>
                        )}
                        {todo.completed && (
                          <Badge variant="secondary" className="text-xs">
                            ✅ Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="text-center mt-8 p-4">
            <Separator className="mb-4" />
            <p className="text-gray-500">
              {completedCount === totalCount && totalCount > 0
                ? "🎉 All done! Great job!"
                : `Keep going! ${totalCount - completedCount} todo${totalCount - completedCount !== 1 ? 's' : ''} remaining.`}
            </p>
            {isUsingStubData && (
              <p className="text-amber-600 text-sm mt-2">
                💡 Running in demo mode - implement backend handlers for full functionality
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;