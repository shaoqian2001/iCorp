"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import { buildSystemPrompt, buildWorkspaceContext } from "@/lib/ai/context";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  clearApiKey,
  getApiKey,
  getModel,
  getProvider,
  setApiKey,
  setModel,
  setProvider,
  type Provider,
} from "@/lib/ai/settings";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AssistantView() {
  const [provider, setProviderState] = useState<Provider>("anthropic");
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState("");
  const [model, setModelState] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyField, setShowKeyField] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = getProvider();
    setProviderState(initial);
    setApiKeyState(getApiKey(initial) || null);
    setModelState(getModel(initial));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const providerInfo = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  const changeProvider = (next: Provider) => {
    setProvider(next);
    setProviderState(next);
    setApiKeyState(getApiKey(next) || null);
    setModelState(getModel(next));
    setKeyDraft("");
  };

  const saveKey = () => {
    const value = keyDraft.trim();
    if (!value) return;
    setApiKey(provider, value);
    setApiKeyState(value);
    setKeyDraft("");
    setShowKeyField(false);
  };

  const forgetKey = () => {
    clearApiKey(provider);
    setApiKeyState(null);
    setMessages([]);
  };

  const changeModel = (value: string) => {
    setModelState(value);
    setModel(provider, value);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const context = await buildWorkspaceContext();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          system: buildSystemPrompt(context),
          messages: history,
        }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const appendDelta = (delta: string) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + delta };
          }
          return next;
        });

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const frame = JSON.parse(line) as {
            type: string;
            text?: string;
            message?: string;
          };
          if (frame.type === "delta" && frame.text) appendDelta(frame.text);
          else if (frame.type === "error") {
            throw new Error(frame.message ?? "The assistant hit an error.");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setBusy(false);
    }
  };

  const providerSelect = (
    <TextField
      select
      size="small"
      label="Provider"
      value={provider}
      onChange={(e) => changeProvider(e.target.value as Provider)}
      sx={{ minWidth: 190 }}
    >
      {PROVIDERS.map((p) => (
        <MenuItem key={p.id} value={p.id}>
          {p.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const modelField = providerInfo.freeformModel ? (
    <TextField
      size="small"
      label="Model"
      value={model}
      onChange={(e) => changeModel(e.target.value)}
      placeholder="e.g. openai/gpt-4o-mini"
      sx={{ minWidth: 240 }}
    />
  ) : (
    <TextField
      select
      size="small"
      label="Model"
      value={model}
      onChange={(e) => changeModel(e.target.value)}
      sx={{ minWidth: 240 }}
    >
      {PROVIDER_MODELS[provider].map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  // --- Setup gate: no key for the selected provider --------------------------
  if (apiKey === null) {
    return (
      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 6 }, maxWidth: 640, mx: "auto" }}>
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography variant="overline" color="primary">
            Solo Studio
          </Typography>
          <Typography variant="h4" component="h1">
            Assistant
          </Typography>
          <Typography color="text.secondary">
            Chat with an AI about your workspace.
          </Typography>
        </Stack>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connect an API key
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Use a pay-as-you-go API key from your chosen provider. Create one
              at{" "}
              <Link href={providerInfo.keysUrl} target="_blank" rel="noopener">
                {providerInfo.keysUrl.replace("https://", "")}
              </Link>
              . The key is stored only in this browser, sent to this app&apos;s
              own proxy route, and is never included in your data export.
            </Typography>
            <Stack spacing={2}>
              {providerSelect}
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  type="password"
                  size="small"
                  label={providerInfo.keyHint}
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveKey();
                  }}
                />
                <Button variant="contained" onClick={saveKey} disabled={!keyDraft.trim()}>
                  Save
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // --- Chat -------------------------------------------------------------------
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        maxWidth: 860,
        mx: "auto",
        px: { xs: 1.5, sm: 3 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ py: 2 }}
      >
        <Typography variant="h5" component="h1">
          Assistant
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {providerSelect}
          {modelField}
          <Tooltip title="API key">
            <IconButton onClick={() => setShowKeyField((v) => !v)} aria-label="API key settings">
              <KeyOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {showKeyField && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={forgetKey}>
              Forget key
            </Button>
          }
        >
          Your {providerInfo.label} key is stored locally in this browser.
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
        {messages.length === 0 ? (
          <Stack spacing={1} sx={{ color: "text.secondary", py: 6, textAlign: "center" }}>
            <Typography>Ask about your goals, projects, or this week.</Typography>
            <Typography variant="body2">
              e.g. &quot;What should I focus on today?&quot; or &quot;Summarize my
              active projects.&quot;
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Paper
                  variant={message.role === "user" ? "elevation" : "outlined"}
                  elevation={message.role === "user" ? 0 : undefined}
                  sx={{
                    px: 2,
                    py: 1.25,
                    maxWidth: "85%",
                    backgroundColor:
                      message.role === "user" ? "primary.main" : "background.paper",
                    color: message.role === "user" ? "primary.contrastText" : "text.primary",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {message.content ||
                    (busy && index === messages.length - 1 ? (
                      <CircularProgress size={16} />
                    ) : null)}
                </Paper>
              </Box>
            ))}
          </Stack>
        )}
        <div ref={endRef} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ py: 2 }}>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          placeholder="Message the assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          disabled={busy}
        />
        <IconButton
          color="primary"
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          {busy ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Stack>
    </Box>
  );
}
