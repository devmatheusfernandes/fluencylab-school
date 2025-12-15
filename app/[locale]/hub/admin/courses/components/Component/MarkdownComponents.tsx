// app/components/MarkdownComponents.tsx
import React from "react";

// Define the type for the props received by custom markdown components
// This helps with type safety when defining your custom components.
interface MarkdownComponentProps {
  node?: any; // The AST node from remark
  [key: string]: any; // Allow other props
}

export const markdownComponents = {
  h1: ({ node, ...props }: MarkdownComponentProps) => (
    <h1
      className="text-3xl sm:text-4xl font-bold text-blue-700 mb-6 pb-2 border-b-2 border-blue-200"
      {...props}
    />
  ),
  h2: ({ node, ...props }: MarkdownComponentProps) => (
    <h2
      className="text-2xl sm:text-3xl font-semibold text-blue-600 mt-8 mb-4"
      {...props}
    />
  ),
  h3: ({ node, ...props }: MarkdownComponentProps) => (
    <h3
      className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3"
      {...props}
    />
  ),
  p: ({ node, ...props }: MarkdownComponentProps) => (
    <p
      className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
      {...props}
    />
  ),
  ul: ({ node, ...props }: MarkdownComponentProps) => (
    <ul
      className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 pl-4 space-y-1"
      {...props}
    />
  ),
  li: ({ node, ...props }: MarkdownComponentProps) => (
    <li className="leading-relaxed" {...props} />
  ),
  table: ({ node, ...props }: MarkdownComponentProps) => (
    <div className="overflow-x-auto my-6 rounded-lg shadow">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }: MarkdownComponentProps) => (
    <thead className="bg-blue-50 dark:bg-blue-900/30" {...props} />
  ),
  th: ({ node, ...props }: MarkdownComponentProps) => (
    <th
      className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider"
      {...props}
    />
  ),
  tbody: ({ node, ...props }: MarkdownComponentProps) => (
    <tbody
      className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
      {...props}
    />
  ),
  tr: ({ node, ...props }: MarkdownComponentProps) => (
    <tr
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
      {...props}
    />
  ),
  td: ({ node, ...props }: MarkdownComponentProps) => (
    <td
      className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-normal"
      {...props}
    />
  ),
  hr: ({ node, ...props }: MarkdownComponentProps) => (
    <hr
      className="my-8 border-t-2 border-gray-200 dark:border-gray-600"
      {...props}
    />
  ),
  strong: ({ node, ...props }: MarkdownComponentProps) => (
    <strong
      className="font-semibold text-gray-800 dark:text-white"
      {...props}
    />
  ),
  em: ({ node, ...props }: MarkdownComponentProps) => (
    <em className="italic text-gray-600 dark:text-gray-400" {...props} />
  ),
  input: ({ node, checked, ...props }: MarkdownComponentProps) => {
    if (props.type === "checkbox" && props.disabled) {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled
          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      );
    }
    return <input {...props} />;
  },
  a: ({ node, ...props }: MarkdownComponentProps) => (
    <a
      className="text-blue-600 dark:text-blue-400 hover:underline"
      {...props}
    />
  ),
  code: ({
    node,
    inline,
    className,
    children,
    ...props
  }: MarkdownComponentProps) => {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <pre
        className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto my-2 text-sm font-mono text-gray-800 dark:text-gray-200"
        {...props}
      >
        <code>{children}</code>
      </pre>
    ) : (
      <code
        className="bg-gray-100 dark:bg-gray-700/50 text-red-600 dark:text-red-400 px-1 py-0.5 rounded-sm font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
  blockquote: ({ node, ...props }: MarkdownComponentProps) => (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4"
      {...props}
    />
  ),
};
