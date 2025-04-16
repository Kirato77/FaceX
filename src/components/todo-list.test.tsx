import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

const user = userEvent.setup();

import { TodoList } from "./todo-list";

describe("<TodoList />", () => {
	test("it will render an text input and a button", () => {
		const { getByPlaceholderText, getByText, unmount } = render(() => (
			<TodoList />
		));
		expect(getByPlaceholderText("new todo here")).toBeInTheDocument();
		expect(getByText("Add Todo")).toBeInTheDocument();
		unmount();
	});

	test("it will add a new todo", async () => {
		const { getByPlaceholderText, getByText, unmount } = render(() => (
			<TodoList />
		));
		const input = getByPlaceholderText("new todo here") as HTMLInputElement;
		const button = getByText("Add Todo");
		input.value = "test new todo";
		await user.click(button as HTMLInputElement);
		expect(input.value).toBe("");
		expect(getByText(/test new todo/)).toBeInTheDocument();
		unmount();
	});
});
