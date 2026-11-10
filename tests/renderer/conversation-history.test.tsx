import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationHistory } from "../../src/renderer/operator/components/ConversationHistory.js";

describe("ConversationHistory", () => {
  it("renders the empty state with the provided context", () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        title="Conversation history"
        emptyHint="No confirmed turns yet."
        speakerLabels={{ A: "Station A", B: "Station B" }}
        entries={[]}
        viewerSide="A"
        field="transcript"
      />
    );

    expect(html).toContain("Conversation history");
    expect(html).toContain("No confirmed turns yet.");
    expect(html).toContain("conversation-history-count\">0<");
  });

  it("renders transcript turns with own and remote speaker styling plus resolved language labels", () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        title="Conversation history"
        emptyHint="No confirmed turns yet."
        speakerLabels={{ A: "Station A", B: "Station B" }}
        entries={[
          {
            id: "turn-1",
            sequence: 1,
            speakerSide: "A",
            transcript: "Buongiorno",
            translation: "Good morning",
            sourceLanguage: null,
            targetLanguage: "en"
          },
          {
            id: "turn-2",
            sequence: 2,
            speakerSide: "B",
            transcript: "Hello",
            translation: "Ciao",
            sourceLanguage: "en-US",
            targetLanguage: "it"
          }
        ]}
        viewerSide="A"
        field="transcript"
      />
    );

    expect(html).toContain("history-bubble history-bubble-own");
    expect(html).toContain("history-bubble history-bubble-other");
    expect(html).toContain("#1");
    expect(html).toContain("#2");
    expect(html).toContain("Station A");
    expect(html).toContain("Station B");
    expect(html).toContain("Auto");
    expect(html).toContain("Inglese");
    expect(html).toContain("Stati Uniti");
    expect(html).toContain("Italiano");
    expect(html).toContain("Buongiorno");
    expect(html).not.toContain("Good morning");
  });

  it("renders translated turns when the translation field is requested", () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        title="Conversation history"
        emptyHint="No confirmed turns yet."
        speakerLabels={{ A: "Station A", B: "Station B" }}
        entries={[
          {
            id: "turn-1",
            sequence: 1,
            speakerSide: "A",
            transcript: "Buongiorno",
            translation: "Good morning",
            sourceLanguage: null,
            targetLanguage: "en"
          }
        ]}
        viewerSide="A"
        field="translation"
      />
    );

    expect(html).toContain("Good morning");
    expect(html).not.toContain("Buongiorno");
  });

  it("uses the canonical interaction-language labels in runtime history metadata", () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        title="Conversation history"
        emptyHint="No confirmed turns yet."
        speakerLabels={{ A: "Station A", B: "Station B" }}
        entries={[
          {
            id: "turn-1",
            sequence: 1,
            speakerSide: "A",
            transcript: "Ola",
            translation: "Hello",
            sourceLanguage: "en-US",
            targetLanguage: "pt"
          }
        ]}
        viewerSide="A"
        field="transcript"
      />
    );

    expect(html).toContain("Portoghese");
    expect(html).not.toContain("-&gt; Portoghese (Brasile)");
  });

  it("renders the detected regional English source locale", () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        title="Conversation history"
        emptyHint="No confirmed turns yet."
        speakerLabels={{ A: "Station A", B: "Station B" }}
        entries={[
          {
            id: "turn-1",
            sequence: 1,
            speakerSide: "A",
            transcript: "Hello",
            translation: "Ciao",
            sourceLanguage: "en-US",
            targetLanguage: "it"
          }
        ]}
        viewerSide="A"
        field="transcript"
      />
    );

    expect(html).toContain("Inglese");
    expect(html).not.toContain("American English");
    expect(html).toContain("Stati Uniti");
  });

  it("avoids italian fallback labels in visitor history metadata when a localized display locale is provided", () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        title="Ιστορικό συνομιλίας"
        emptyHint="Καμία καταχώριση ακόμα."
        speakerLabels={{ A: "A", B: "B" }}
        entries={[
          {
            id: "turn-1",
            sequence: 1,
            speakerSide: "B",
            transcript: "Γεια",
            translation: "Hello",
            sourceLanguage: null,
            targetLanguage: "en"
          },
          {
            id: "turn-2",
            sequence: 2,
            speakerSide: "A",
            transcript: "Hello",
            translation: "Γεια",
            sourceLanguage: "it-IT",
            targetLanguage: "el"
          }
        ]}
        viewerSide="B"
        field="translation"
        languageDisplayLocale="el"
        automaticSourceLanguageLabel={null}
      />
    );

    expect(html).toContain(">A<");
    expect(html).toContain(">B<");
    expect(html).not.toContain("Auto");
    expect(html).not.toContain("Inglese");
    expect(html).not.toContain("Italiano");
  });
});
