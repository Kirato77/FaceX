import { For, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { TextField, TextFieldInput } from "~/components/ui/text-field";

type Todo = { id: number; text: string; completed: boolean };

export const TodoList = () => {
	let input!: HTMLInputElement;
	let todoId = 0;
	const [todos, setTodos] = createSignal<Todo[]>([]);
	const addTodo = (text: string) => {
		setTodos([...todos(), { id: ++todoId, text, completed: false }]);
	};
	const toggleTodo = (id: number) => {
		setTodos(
			todos().map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo,
			),
		);
	};

	return (
		<>
			<div class="flex gap-2">
				<TextField class="flex-1">
					<TextFieldInput
						placeholder="new todo here"
						ref={input}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.currentTarget.value.trim()) return;
							if (e.key === "Enter") {
								addTodo(e.currentTarget.value);
								e.currentTarget.value = "";
							}
						}}
					/>
				</TextField>
				<Button
					onClick={() => {
						if (!input.value.trim()) return;
						addTodo(input.value);
						input.value = "";
					}}
				>
					Add Todo
				</Button>
			</div>
			<For each={todos()}>
				{(todo) => {
					const { id, text } = todo;
					return (
						<div class="flex items-center gap-2 py-1">
							<Checkbox
								id={`todo-${id}`}
								checked={todo.completed}
								onChange={() => toggleTodo(id)}
							/>
							<Label
								for={`todo-${id}`}
								class={
									todo.completed ? "line-through text-muted-foreground" : ""
								}
							>
								{text}
							</Label>
						</div>
					);
				}}
			</For>
		</>
	);
};
