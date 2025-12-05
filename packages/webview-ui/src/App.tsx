import "./index.css";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";

type InitialData = {
  label: string;
  content: string;
};

const initialData = (window as any).initialData as InitialData; // eslint-disable-line
const vscode = (window as any).acquireVsCodeApi(); // eslint-disable-line

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-4",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-4",
          },
        },
        code: {
          HTMLAttributes: {
            class:
              "bg-gray-700 p-1 rounded text-slate-100 whitespace-break-spaces",
          },
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }).extend({
        renderHTML({
          node,
          HTMLAttributes,
        }: {
          node: any;
          HTMLAttributes: Record<string, any>;
        }) {
          const level = (
            this.options.levels.includes(node.attrs.level)
              ? node.attrs.level
              : 1
          ) as number;
          const classes: { [index: number]: string } = {
            1: "text-3xl font-bold",
            2: "text-2xl font-bold",
            3: "text-xl font-bold",
          };

          return [
            "h" + level,
            {
              ...HTMLAttributes,
              class: classes[level],
            },
            0,
          ];
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "list-none p-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex task-list-item items-baseline",
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: `Start typing...`,
        emptyNodeClass:
          "first:before:text-gray-400 first:before:float-left first:before:content-[attr(data-placeholder)] first:before:pointer-events-none",
      }),
      History.configure({
        depth: 100,
      }),
    ],
    autofocus: true,
    content: JSON.parse(initialData.content || "{}"),
    editorProps: {
      attributes: {
        class: "prose prose-base px-2 caret-grey-500 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      const json = editor.getJSON();
      localStorage.setItem("content", JSON.stringify(json));
      vscode.postMessage({ type: "update", data: { message: json } });
    },
  });

  return (
    <>
      <h1 className="w-full text-3xl font-bold text-left p-1.5 ml-2">
        {initialData.label}
      </h1>
      <div className="w-full h-full p-1.5 mt-4">
        <EditorContent editor={editor} />
      </div>
    </>
  );
};

const App = () => {
  return (
    <div>
      <TiptapEditor />
    </div>
  );
};

export default App;
