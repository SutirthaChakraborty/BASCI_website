/**
 * BASCI Admin - thin client for the Gemini Developer API, called directly
 * from the browser since this site has no backend. The API key lives only
 * in localStorage on the admin's own machine, entered via the Settings tab.
 */
(function (global) {
    'use strict';

    const SETTINGS_KEY = 'basci_admin_gemini_settings_v1';
    const DEFAULTS = {
        apiKey: '',
        textModel: 'gemini-2.5-flash',
        imageModel: 'gemini-2.5-flash-image'
    };

    const imageCache = new Map();

    function getSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return Object.assign({}, DEFAULTS);
            return Object.assign({}, DEFAULTS, JSON.parse(raw));
        } catch (e) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function saveSettings(partial) {
        const merged = Object.assign({}, getSettings(), partial);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        return merged;
    }

    function hasApiKey() {
        return !!getSettings().apiKey;
    }

    function endpointFor(model) {
        return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    }

    async function callGenerateContent(model, contents, generationConfig) {
        const settings = getSettings();
        if (!settings.apiKey) {
            throw new Error('No Gemini API key set. Open the Settings tab and paste your API key first.');
        }
        const body = { contents };
        if (generationConfig) body.generationConfig = generationConfig;

        let response;
        try {
            response = await fetch(endpointFor(model), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': settings.apiKey
                },
                body: JSON.stringify(body)
            });
        } catch (networkErr) {
            throw new Error('Could not reach Gemini API (network error). Check your connection and try again.');
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            const message = (data && data.error && data.error.message) || `Gemini API error (HTTP ${response.status})`;
            throw new Error(message);
        }
        return data;
    }

    function extractText(data) {
        const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
        if (!parts) return '';
        return parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('\n').trim();
    }

    function extractImage(data) {
        const candidate = data && data.candidates && data.candidates[0];
        const parts = candidate && candidate.content && candidate.content.parts;
        if (parts) {
            const imgPart = parts.find((p) => p.inlineData && p.inlineData.data);
            if (imgPart) {
                return { mimeType: imgPart.inlineData.mimeType || 'image/png', data: imgPart.inlineData.data };
            }
        }
        const blockReason = data && data.promptFeedback && data.promptFeedback.blockReason;
        const finishReason = candidate && candidate.finishReason;
        const fallbackText = extractText(data);
        let reason = 'No image was returned.';
        if (blockReason) reason = `Request was blocked by safety filters (${blockReason}).`;
        else if (finishReason && finishReason !== 'STOP') reason = `Generation stopped early (${finishReason}).`;
        else if (fallbackText) reason = `Gemini responded with text instead of an image: "${fallbackText.slice(0, 200)}"`;
        throw new Error(`${reason} Try rewording your description and generate again.`);
    }

    async function enhancePrompt({ scaffold, details, aspect }) {
        const settings = getSettings();
        const instruction = [
            'You are a creative director writing an image-generation prompt for a sports club marketing poster.',
            `Base style brief: ${scaffold}`,
            `Specific request from the club admin: ${details || '(no extra detail given, use the base style brief creatively)'}`,
            `Target aspect ratio: ${aspect || '1:1'}.`,
            'Write ONE dense paragraph (max 120 words) describing the final poster image in vivid visual detail: ' +
            'composition, lighting, color palette, mood, and any text-safe negative space to leave. ' +
            'Do not include the words "poster" or "template" in a meta way, just describe the scene directly. ' +
            'Reply with ONLY the prompt paragraph, no preamble, no quotes.'
        ].join('\n\n');

        const data = await callGenerateContent(settings.textModel, [
            { role: 'user', parts: [{ text: instruction }] }
        ]);
        const text = extractText(data);
        if (!text) throw new Error('Gemini did not return an enhanced prompt. Please try again.');
        return text;
    }

    async function generateImage({ prompt, images }) {
        const settings = getSettings();
        const parts = [{ text: prompt }];
        (images || []).forEach((img) => {
            if (img && img.data) parts.push({ inlineData: { mimeType: img.mimeType || 'image/png', data: img.data } });
        });

        const data = await callGenerateContent(
            settings.imageModel,
            [{ role: 'user', parts }],
            { responseModalities: ['TEXT', 'IMAGE'] }
        );
        return extractImage(data);
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const commaIdx = result.indexOf(',');
                resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
            };
            reader.onerror = () => reject(new Error('Could not read file.'));
            reader.readAsDataURL(blob);
        });
    }

    async function fetchAsBase64(url, mimeType) {
        if (imageCache.has(url)) return imageCache.get(url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const blob = await response.blob();
        const data = await blobToBase64(blob);
        const result = { mimeType: mimeType || blob.type || 'image/png', data };
        imageCache.set(url, result);
        return result;
    }

    global.BASCIGemini = {
        getSettings,
        saveSettings,
        hasApiKey,
        enhancePrompt,
        generateImage,
        blobToBase64,
        fetchAsBase64
    };
})(window);
