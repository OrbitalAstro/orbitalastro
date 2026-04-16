// Gemini AI client for generating astrological interpretations

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

// Helper function to list available Gemini models that support generateContent
async function listAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (response.ok) {
      const data = await response.json();
      // Filter models that support generateContent
      const models =
        data.models?.filter((m: any) =>
          m.supportedGenerationMethods?.includes("generateContent"),
        ) || [];
      // Extract model names (remove 'models/' prefix if present)
      return models.map((m: any) => {
        const name = m.name || "";
        return name.replace("models/", "");
      });
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
  return [];
}

export async function callGemini(
  apiKey: string,
  prompt: string,
  systemInstruction?: string,
  language: "en" | "fr" | "es" = "en",
): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }

  const messages: GeminiMessage[] = [];

  // Add system instruction if provided
  if (systemInstruction) {
    messages.push({
      role: "user",
      parts: [{ text: systemInstruction }],
    });
    messages.push({
      role: "model",
      parts: [{ text: "Understood. I will follow these instructions." }],
    });
  }

  // Add the actual prompt
  messages.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const requestBody: GeminiRequest = {
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096, // Increased for 700-word dialogues
    },
  };

  try {
    // Try to get available models first, then use them
    const availableModels = await listAvailableModels(apiKey);

    // Build list of models to try, prioritizing available ones
    const modelsToTry: Array<{ name: string; version: string }> = [];

    // Add available models first
    if (availableModels.length > 0) {
      const flashModels = availableModels.filter(
        (m) => m.includes("flash") && !m.includes("exp"),
      );
      const proModels = availableModels.filter(
        (m) => m.includes("pro") && !m.includes("exp"),
      );

      flashModels.forEach((m) =>
        modelsToTry.push({ name: m, version: "v1beta" }),
      );
      proModels.forEach((m) =>
        modelsToTry.push({ name: m, version: "v1beta" }),
      );
    }

    // Fallback to common model names if no models found or if listModels failed
    // Based on errors, gemini-2.5-pro exists but has rate limits (429)
    // Try stable model names without -latest suffix
    if (modelsToTry.length === 0) {
      modelsToTry.push(
        { name: "gemini-1.5-flash", version: "v1beta" },
        { name: "gemini-1.5-pro", version: "v1beta" },
        { name: "gemini-2.0-flash-exp", version: "v1beta" },
        { name: "gemini-2.0-flash-thinking-exp", version: "v1beta" },
        { name: "gemini-exp-1206", version: "v1beta" },
        { name: "gemini-exp-1121", version: "v1beta" },
        // Try v1 API as last resort
        { name: "gemini-1.5-flash", version: "v1" },
      );
    }

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const status = response.status;

          // Handle rate limiting (429) with exponential backoff
          if (status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const waitTime = retryAfter
              ? parseInt(retryAfter) * 1000
              : Math.min(1000 * Math.pow(2, modelsToTry.indexOf(model)), 10000);
            console.warn(
              `Rate limited on ${model.name}, waiting ${waitTime}ms before trying next model...`,
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            lastError = new Error(
              errorData.error?.message ||
                `Rate limit exceeded. Please wait a moment and try again.`,
            );
            // Continue to next model
            continue;
          }

          // For other errors, try next model immediately
          lastError = new Error(
            errorData.error?.message ||
              `Gemini API error: ${status} ${response.statusText}`,
          );
          continue;
        }

        // Success! Parse and return response
        const data: GeminiResponse = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
          lastError = new Error("No response from Gemini API");
          continue;
        }

        const text = data.candidates[0].content.parts[0].text;
        return text;
      } catch (err: any) {
        lastError = err;
        // Continue to next model
        continue;
      }
    }

    // If all models failed, throw the last error
    if (lastError) {
      throw lastError;
    }

    throw new Error("All Gemini models failed");
  } catch (error: any) {
    console.error("Gemini API error:", error);
    // Provide user-friendly error messages
    if (
      error.message?.includes("Rate limit") ||
      error.message?.includes("429")
    ) {
      throw new Error(
        "Rate limit exceeded. Please wait a few moments and try again, or use a different Gemini API key.",
      );
    }
    throw new Error(`Failed to call Gemini API: ${error.message}`);
  }
}

export async function generateAstrologicalResponse(
  apiKey: string,
  question: string,
  chart: any,
  language: "en" | "fr" | "es" = "en",
  userSettings?: {
    houseSystem?: string;
    narrativeTone?: string;
    narrativeDepth?: string;
    narrativeFocus?: string[];
    includeExtraObjects?: boolean;
    useTopocentricMoon?: boolean;
    includeAspects?: boolean;
  },
): Promise<string> {
  const systemInstructions = {
    en: "You are an expert astrological assistant. Provide insightful, accurate interpretations based on natal chart data. Be clear, helpful, and use astrological terminology appropriately. When interpreting, consider the user's preferences for house system, narrative tone, and focus areas.",
    fr: "Vous êtes un assistant astrologique expert. Fournissez des interprétations perspicaces et précises basées sur les données du thème natal. Soyez clair, utile et utilisez la terminologie astrologique de manière appropriée. Lors de l'interprétation, tenez compte des préférences de l'utilisateur pour le système de maisons, le ton narratif et les domaines de focus.",
    es: "Eres un asistente astrológico experto. Proporciona interpretaciones perspicaces y precisas basadas en datos de cartas natales. Sé claro, útil y usa la terminología astrológica apropiadamente. Al interpretar, considera las preferencias del usuario para el sistema de casas, tono narrativo y áreas de enfoque.",
  };

  // Build comprehensive chart summary with settings
  const chartData: any = {
    planets: chart.planets,
    ascendant: chart.ascendant,
    midheaven: chart.midheaven,
    houses: chart.houses,
    house_system: chart.house_system || userSettings?.houseSystem || "placidus",
  };

  // Add aspects if available
  if (chart.aspects) {
    chartData.aspects = chart.aspects;
  }

  // Add patterns if available
  if (chart.patterns) {
    chartData.patterns = chart.patterns;
  }

  const chartSummary = JSON.stringify(chartData, null, 2);

  // Build settings context
  let settingsContext = "";
  if (userSettings) {
    const settingsInfo: string[] = [];
    if (userSettings.houseSystem) {
      settingsInfo.push(`House System: ${userSettings.houseSystem}`);
    }
    if (userSettings.narrativeTone) {
      settingsInfo.push(`Narrative Tone: ${userSettings.narrativeTone}`);
    }
    if (userSettings.narrativeDepth) {
      settingsInfo.push(`Narrative Depth: ${userSettings.narrativeDepth}`);
    }
    if (userSettings.narrativeFocus && userSettings.narrativeFocus.length > 0) {
      settingsInfo.push(
        `Focus Areas: ${userSettings.narrativeFocus.join(", ")}`,
      );
    }
    if (userSettings.includeExtraObjects) {
      settingsInfo.push("Includes: Extra objects (Lilith, Asteroids, etc.)");
    }
    if (userSettings.useTopocentricMoon) {
      settingsInfo.push("Uses: Topocentric Moon Parallax Correction");
    }

    if (settingsInfo.length > 0) {
      settingsContext = `\n\nUser Preferences:\n${settingsInfo.join("\n")}`;
    }
  }

  // Determine if this is about another person or the user
  const personalPronouns = [
    "mon",
    "ma",
    "mes",
    "my",
    "me",
    "mi",
    "mis",
    "moi",
    "yo",
  ];
  const lowerQuestion = question.toLowerCase();
  const isAboutUser = personalPronouns.some((pronoun) =>
    lowerQuestion.includes(pronoun),
  );
  const isAboutOtherPerson =
    !isAboutUser &&
    (/(?:about|pour|de|sur|chart|thème|carte)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/.test(
      question,
    ) ||
      /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/.test(question));

  const personContext = isAboutOtherPerson
    ? language === "fr"
      ? "\n\nIMPORTANT: Cette question concerne une autre personne mentionnée dans la question, PAS l'utilisateur. Le thème natal fourni est celui de cette autre personne. Répondez en analysant le thème de cette personne, pas celui de l'utilisateur."
      : language === "es"
        ? "\n\nIMPORTANTE: Esta pregunta es sobre otra persona mencionada en la pregunta, NO el usuario. La carta natal proporcionada es de esa otra persona. Responde analizando la carta de esa persona, no la del usuario."
        : "\n\nIMPORTANT: This question is about another person mentioned in the question, NOT the user. The natal chart provided is for that other person. Answer by analyzing that person's chart, not the user's chart."
    : "";

  const prompt =
    language === "fr"
      ? `Voici le thème natal${isAboutOtherPerson ? " de la personne mentionnée dans la question" : " de l'utilisateur"}:\n\n${chartSummary}${settingsContext}${personContext}\n\nQuestion de l'utilisateur: ${question}\n\nRépondez à la question en français en utilisant les données du thème natal fourni. ${isAboutOtherPerson ? "Analysez le thème de la personne mentionnée." : "Adaptez votre réponse au ton narratif et aux domaines de focus de l'utilisateur si applicable."}`
      : language === "es"
        ? `Aquí está la carta natal${isAboutOtherPerson ? " de la persona mencionada en la pregunta" : " del usuario"}:\n\n${chartSummary}${settingsContext}${personContext}\n\nPregunta del usuario: ${question}\n\nResponde la pregunta en español usando los datos de la carta natal proporcionada. ${isAboutOtherPerson ? "Analiza la carta de la persona mencionada." : "Adapta tu respuesta al tono narrativo y áreas de enfoque del usuario si es aplicable."}`
        : `Here is the natal chart${isAboutOtherPerson ? " of the person mentioned in the question" : ""}:\n\n${chartSummary}${settingsContext}${personContext}\n\nUser's question: ${question}\n\nAnswer the question using the natal chart data provided. ${isAboutOtherPerson ? "Analyze the chart of the person mentioned." : "Adapt your response to the user's narrative tone and focus areas if applicable."}`;

  return callGemini(apiKey, prompt, systemInstructions[language], language);
}

export async function generateStory(
  apiKey: string,
  chart: any,
  narrativeConfig: {
    tone?: string;
    depth?: string;
    focus?: string[];
  },
  language: "en" | "fr" | "es" = "en",
): Promise<string> {
  const systemInstructions = {
    en: "You are a skilled astrological storyteller. Create engaging, personalized stories based on natal chart data. Use the narrative tone and depth specified.",
    fr: "Vous êtes un conteur astrologique talentueux. Créez des histoires engageantes et personnalisées basées sur les données du thème natal. Utilisez le ton et la profondeur narrative spécifiés.",
    es: "Eres un narrador astrológico hábil. Crea historias atractivas y personalizadas basadas en datos de cartas natales. Usa el tono y la profundidad narrativa especificados.",
  };

  const chartSummary = JSON.stringify(
    {
      planets: chart.planets,
      ascendant: chart.ascendant,
      midheaven: chart.midheaven,
      houses: chart.houses,
    },
    null,
    2,
  );

  const tone = narrativeConfig.tone || "mythic";
  const depth = narrativeConfig.depth || "standard";
  const focus = narrativeConfig.focus?.join(", ") || "general";

  const prompt =
    language === "fr"
      ? `Créez une histoire astrologique personnalisée basée sur ce thème natal:\n\n${chartSummary}\n\nTon: ${tone}\nProfondeur: ${depth}\nFocus: ${focus}\n\nÉcrivez l'histoire en français.`
      : language === "es"
        ? `Crea una historia astrológica personalizada basada en esta carta natal:\n\n${chartSummary}\n\nTono: ${tone}\nProfundidad: ${depth}\nEnfoque: ${focus}\n\nEscribe la historia en español.`
        : `Create a personalized astrological story based on this natal chart:\n\n${chartSummary}\n\nTone: ${tone}\nDepth: ${depth}\nFocus: ${focus}\n\nWrite the story in English.`;

  return callGemini(apiKey, prompt, systemInstructions[language], language);
}

export async function generateDialogue(
  apiKey: string,
  chart: any,
  birthData: {
    birth_date: string;
    birth_time: string;
    birth_place: string;
    firstName?: string;
  },
  language: "en" | "fr" | "es" = "fr",
): Promise<string> {
  const systemInstructions = {
    en: "You are Orbital, a wise and loving guide. Create a positive pre-incarnation dialogue between the Source and a soul choosing their avatar for the game of life. Make it playful, warm, and resonant with the soul's astrological blueprint.",
    fr: "Tu es Orbital, un guide sage et aimant. Crée un dialogue positif pré-incarnation entre la Source et une âme qui choisit son avatar pour venir jouer au jeu de la vie. Rends-le amusant, chaleureux et en résonance avec le thème astral de l'âme.",
    es: "Eres Orbital, un guía sabio y amoroso. Crea un diálogo positivo pre-incarnación entre la Fuente y un alma que elige su avatar para venir a jugar al juego de la vida. Hazlo juguetón, cálido y en resonancia con el tema astral del alma.",
  };

  // Extract key planetary placements
  const getPlanetInfo = (planetName: string) => {
    const planet = chart.planets?.[planetName];
    if (!planet) return null;

    const sign = planet.sign || "";
    const house = planet.house || "";

    // Find important aspects for this planet
    const aspects =
      chart.aspects?.filter(
        (a: any) => a.body1 === planetName || a.body2 === planetName,
      ) || [];
    const importantAspects = aspects
      .filter((a: any) =>
        ["conjunction", "opposition", "square", "trine"].includes(a.aspect),
      )
      .slice(0, 3)
      .map((a: any) => {
        const otherPlanet = a.body1 === planetName ? a.body2 : a.body1;
        return `${a.aspect} ${otherPlanet}`;
      })
      .join(", ");

    return {
      sign,
      house,
      aspects: importantAspects || "Aucun aspect majeur",
    };
  };

  const sun = getPlanetInfo("sun");
  const moon = getPlanetInfo("moon");
  const venus = getPlanetInfo("venus");
  const mars = getPlanetInfo("mars");
  const northNode = getPlanetInfo("true_node");

  // Find other important planets (Jupiter, Saturn, or prominent placements)
  const otherTalents: string[] = [];
  const importantPlanets = [
    "jupiter",
    "saturn",
    "mercury",
    "pluto",
    "uranus",
    "neptune",
    "chiron",
  ];
  for (const planetName of importantPlanets) {
    const planet = chart.planets?.[planetName];
    if (planet && (planet.house <= 3 || planet.house >= 10)) {
      otherTalents.push(
        `${planetName.charAt(0).toUpperCase() + planetName.slice(1)}: ${planet.sign}, Maison ${planet.house}`,
      );
    }
  }

  const firstName = birthData.firstName || "l'âme";
  const birthInfo = `${birthData.birth_date}, ${birthData.birth_time}, ${birthData.birth_place}`;

  const prompt = `Orbital, écris un dialogue positif d'environ 700 mots (maximum deux pages recto verso), basé sur les coordonnées d'un thème natal, en utilisant et suivant les éléments suivants :

Langue : français

Dialogue pré-incarnation entre la Source et ${firstName}

Naissance : ${birthInfo}

Placements principaux :

Soleil : ${sun ? `${sun.sign}, Maison ${sun.house}, ${sun.aspects}` : "Non disponible"}

Lune : ${moon ? `${moon.sign}, Maison ${moon.house}, ${moon.aspects}` : "Non disponible"}

Vénus : ${venus ? `${venus.sign}, Maison ${venus.house}, ${venus.aspects}` : "Non disponible"}

Mars : ${mars ? `${mars.sign}, Maison ${mars.house}, ${mars.aspects}` : "Non disponible"}

Autres talents : ${otherTalents.length > 0 ? otherTalents.join(", ") : "Aucun placement particulier"}

Nœud Nord : ${northNode ? `${northNode.sign}, Maison ${northNode.house}, ${northNode.aspects}` : "Non disponible"}

Le ton doit être amusant, comme si l'âme choisit son avatar pour venir jouer au jeu de la vie, et correspondre à la personnalité du thème natal : la Source pose les questions et l'âme (la personne qui va s'incarner) répond.

Le texte doit résonner avec la personnalité de la personne [Planètes, signes, maisons, aspects importants], comme une conversation d'âme à âme avant la naissance.

IMPORTANT : Le dialogue doit maximum 700 mots. Développe chaque placement planétaire, chaque aspect, chaque maison. Fais des échanges détaillés entre la Source et l'âme. Ne coupe pas le dialogue - il doit être complet et approfondi.

[Signature finale : Amour, ou un mot approprié à la personnalité], 

Source

Ne demande aucune autres instructions. Produit le document complet de 700 mots.

Note : 💫 Vois ce dialogue comme un souvenir de ton âme — une conversation intime avec ce qui te guide depuis toujours.`;

  return callGemini(apiKey, prompt, systemInstructions[language], language);
}
