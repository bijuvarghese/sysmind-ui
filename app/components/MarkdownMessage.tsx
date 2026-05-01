import type { ComponentPropsWithoutRef } from "react";
import { Box, Divider, Link as MuiLink, Paper, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

type MarkdownMessageProps = {
  content: string;
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <Box className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <Typography component="div" variant="body2" sx={{ mb: 2, lineHeight: 1.8, color: "text.primary" }}>
              {children}
            </Typography>
          ),
          h1: ({ children }) => (
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
              {children}
            </Typography>
          ),
          code({ inline, className, children, ...props }: MarkdownCodeProps) {
            const match = /language-(\w+)/.exec(className || "");
            const codeText = String(children);
            const isBlock = !inline && (Boolean(match) || codeText.includes("\n"));

            return isBlock ? (
              <Paper
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderColor: "rgba(148, 163, 184, 0.2)",
                  bgcolor: "rgba(2, 6, 23, 0.85)",
                  mb: 2,
                }}
              >
                {match ? (
                  <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ letterSpacing: 1.2, color: "text.secondary" }}>
                      {match[1]}
                    </Typography>
                  </Box>
                ) : null}
                <Box component="pre" sx={{ m: 0, px: 2, py: 1.75, overflowX: "auto" }}>
                  <Box
                    component="code"
                    sx={{ display: "block", fontSize: "0.8rem", lineHeight: 1.7, color: "text.primary" }}
                    {...props}
                  >
                    {children}
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Box
                component="code"
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: "rgba(124, 58, 237, 0.16)",
                  color: "primary.light",
                  fontFamily: "monospace",
                  fontSize: "0.92em",
                }}
                {...props}
              >
                {children}
              </Box>
            );
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ children, href }) => (
            <MuiLink
              href={href}
              target="_blank"
              rel="noreferrer"
              sx={{ color: "secondary.light", textDecorationColor: "rgba(34, 197, 94, 0.55)" }}
            >
              {children}
            </MuiLink>
          ),
          ul: ({ children }) => (
            <Box component="ul" sx={{ ml: 3, my: 2, display: "grid", gap: 1, color: "text.primary" }}>
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box component="ol" sx={{ ml: 3, my: 2, display: "grid", gap: 1, color: "text.primary" }}>
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Box component="li" sx={{ lineHeight: 1.7 }}>
              {children}
            </Box>
          ),
          table: ({ children }) => (
            <Paper variant="outlined" sx={{ overflowX: "auto", borderColor: "rgba(148, 163, 184, 0.2)", mb: 2 }}>
              <Box component="table" sx={{ minWidth: "100%", borderCollapse: "collapse" }}>
                {children}
              </Box>
            </Paper>
          ),
          thead: ({ children }) => <Box component="thead" sx={{ bgcolor: "rgba(15, 23, 42, 0.8)" }}>{children}</Box>,
          tbody: ({ children }) => <Box component="tbody">{children}</Box>,
          tr: ({ children }) => <Box component="tr">{children}</Box>,
          th: ({ children }) => (
            <Box
              component="th"
              sx={{
                px: 1.5,
                py: 1,
                textAlign: "left",
                borderBottom: "1px solid",
                borderColor: "divider",
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              {children}
            </Box>
          ),
          td: ({ children }) => (
            <Box
              component="td"
              sx={{ px: 1.5, py: 1, verticalAlign: "top", borderTop: "1px solid", borderColor: "divider", color: "text.secondary" }}
            >
              {children}
            </Box>
          ),
          hr: () => <Divider sx={{ my: 2, borderColor: "divider" }} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
