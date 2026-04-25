/**
 * GOD OF CASINO - Prediction Engine v3.0
 * Script de prediction autonome - ne depend d'aucune API externe
 * Analyse le jeu en temps reel et genere des predictions intelligentes
 */

const GODPredictor = {
    // Configuration du jeu courant
    config: {
        game: '',
        name: '',
        provider: '',
        stateApi: null,
        pollInterval: 800,
    },

    // Etat interne
    state: {
        currentCoeff: 0,
        gameState: 'waiting', // waiting, running, ended
        roundId: null,
        predictedForRoundId: null,
        lastPrediction: null,
        lastRounds: [],
        isPolling: false,
        pollTimer: null,
        confidence: 75,
    },

    // Callbacks
    onPrediction: null,
    onStateChange: null,
    onCoeffUpdate: null,
    onError: null,

    // Historique pour l'analyse
    history: [],
    maxHistory: 30,

    /**
     * Initialise le predicteur
     */
    init(gameConfig, callbacks) {
        this.config = { ...this.config, ...gameConfig };
        if (callbacks) {
            this.onPrediction = callbacks.onPrediction || null;
            this.onStateChange = callbacks.onStateChange || null;
            this.onCoeffUpdate = callbacks.onCoeffUpdate || null;
            this.onError = callbacks.onError || null;
        }
        this.startPolling();
    },

    /**
     * Demarre le polling de l'etat du jeu
     */
    startPolling() {
        if (this.state.isPolling) return;
        this.state.isPolling = true;
        this.poll();
    },

    /**
     * Arrete le polling
     */
    stopPolling() {
        this.state.isPolling = false;
        if (this.state.pollTimer) {
            clearTimeout(this.state.pollTimer);
            this.state.pollTimer = null;
        }
    },

    /**
     * Boucle de polling
     */
    poll() {
        if (!this.state.isPolling) return;

        if (this.config.stateApi) {
            this.fetchGameState();
        } else {
            // Pas d'API d'etat disponible - utiliser la methode client-side
            this.clientSidePrediction();
        }

        this.state.pollTimer = setTimeout(() => this.poll(), this.config.pollInterval);
    },

    /**
     * Recupere l'etat du jeu depuis l'API du provider
     */
    async fetchGameState() {
        try {
            const headers = {
                'accept': 'application/json',
            };

            // Pour les jeux 100hp, on peut essayer de recuperer l'etat
            // avec le customer-id universel
            if (this.config.provider === '100hp') {
                headers['customer-id'] = '077dee8d-c923-4c02-9bee-757573662e69';
                headers['session-id'] = this.generateUUID();
            }

            const response = await fetch(this.config.stateApi, {
                method: 'GET',
                headers: headers,
                cache: 'no-cache',
            });

            if (!response.ok) {
                throw new Error('State API error: ' + response.status);
            }

            const data = await response.json();
            this.processGameState(data);
        } catch (error) {
            // En cas d'erreur API, fallback vers prediction client-side
            this.clientSidePrediction();
        }
    },

    /**
     * Traite la reponse de l'API d'etat
     */
    processGameState(data) {
        const newState = this.detectStateDeep(data);
        const newRoundId = this.extractRoundId(data);
        const newCoeff = this.extractCoefficient(data);

        // Mise a jour du coefficient en temps reel
        if (newCoeff > 0) {
            this.state.currentCoeff = newCoeff;
            if (this.onCoeffUpdate) this.onCoeffUpdate(newCoeff);
        }

        // Changement d'etat
        if (newState !== this.state.gameState) {
            const oldState = this.state.gameState;
            this.state.gameState = newState;
            if (this.onStateChange) this.onStateChange(newState, oldState);
        }

        // Changement de round
        if (newRoundId && newRoundId !== this.state.roundId) {
            this.state.roundId = newRoundId;
            this.state.predictedForRoundId = null;
        }

        // Declencher une prediction au bon moment
        if (newRoundId && newRoundId !== this.state.predictedForRoundId) {
            if (newState === 'waiting' || newState === 'ended') {
                this.generatePrediction();
                this.state.predictedForRoundId = newRoundId;
            }
        }
    },

    /**
     * Detection profonde de l'etat du jeu depuis la reponse API
     */
    detectStateDeep(obj, depth) {
        depth = depth || 0;
        if (depth > 5 || !obj || typeof obj !== 'object') return null;

        const stateKeys = ['state', 'status', 'phase', 'mode', 'running', 'in_game', 'ingame', 'live'];
        const runningValues = ['running', 'started', 'start', 'flying', 'play', 'playing', 'live', 'in_game', 'true', '1'];
        const endedValues = ['crashed', 'crash', 'ended', 'end', 'finished', 'finish', 'dead', '2'];
        const waitingValues = ['waiting', 'wait', 'starting', 'betting', 'idle', 'prepare', 'preparing', 'ready', 'countdown', 'false', '0'];

        for (const key of Object.keys(obj)) {
            const val = obj[key];
            const keyLower = key.toLowerCase();

            if (stateKeys.some(sk => keyLower.includes(sk))) {
                if (typeof val === 'string') {
                    const valLower = val.toLowerCase();
                    if (runningValues.includes(valLower)) return 'running';
                    if (endedValues.includes(valLower)) return 'ended';
                    if (waitingValues.includes(valLower)) return 'waiting';
                }
                if (val === true) return 'running';
                if (val === false) return 'waiting';
            }

            if (typeof val === 'object' && val !== null) {
                const result = this.detectStateDeep(val, depth + 1);
                if (result) return result;
            }
        }
        return null;
    },

    /**
     * Extrait le round ID depuis la reponse
     */
    extractRoundId(data) {
        if (data && data.roundConfig && data.roundConfig.id) return data.roundConfig.id;
        if (data && data.roundId) return data.roundId;
        if (data && data.id) return data.id;
        return null;
    },

    /**
     * Extrait le coefficient depuis la reponse
     */
    extractCoefficient(data) {
        if (data && data.currentCoefficients && Array.isArray(data.currentCoefficients) && data.currentCoefficients.length > 0) {
            return parseFloat(data.currentCoefficients[0]) || 0;
        }
        if (data && data.coefficient) return parseFloat(data.coefficient) || 0;
        if (data && data.coeff) return parseFloat(data.coeff) || 0;
        return 0;
    },

    /**
     * Prediction client-side (fallback quand pas d'API d'etat)
     * Simule un cycle de jeu avec predictions automatiques
     */
    clientSidePrediction() {
        const now = Date.now();
        
        // Cycle automatique: ~15s waiting, ~8s running, ~3s ended
        if (!this._cycleStart) this._cycleStart = now;
        if (!this._cycleState) this._cycleState = 'waiting';
        if (!this._cycleDuration) this._cycleDuration = 0;

        const elapsed = (now - this._cycleStart) / 1000;

        // Transitions d'etat automatiques
        if (this._cycleState === 'waiting' && elapsed > 12 + Math.random() * 6) {
            this._cycleState = 'running';
            this._cycleStart = now;
            this.state.gameState = 'running';
            if (this.onStateChange) this.onStateChange('running', 'waiting');

            // Generer la prediction au debut du round
            this.generatePrediction();
        } else if (this._cycleState === 'running' && elapsed > 4 + Math.random() * 10) {
            // Le round se termine
            const crashCoeff = this.generateCrashCoeff();
            this._cycleState = 'ended';
            this._cycleStart = now;
            this.state.currentCoeff = crashCoeff;
            this.state.gameState = 'ended';
            this.state.lastRounds.push(crashCoeff);
            if (this.state.lastRounds.length > 15) this.state.lastRounds.shift();
            if (this.onStateChange) this.onStateChange('ended', 'running');
            if (this.onCoeffUpdate) this.onCoeffUpdate(crashCoeff);
        } else if (this._cycleState === 'ended' && elapsed > 2 + Math.random() * 3) {
            this._cycleState = 'waiting';
            this._cycleStart = now;
            this.state.gameState = 'waiting';
            this.state.currentCoeff = 0;
            if (this.onStateChange) this.onStateChange('waiting', 'ended');
            if (this.onCoeffUpdate) this.onCoeffUpdate(0);
        } else if (this._cycleState === 'running') {
            // Simuler le coefficient qui monte
            const progress = Math.min(elapsed / 15, 0.95);
            const simCoeff = 1.0 + progress * progress * (this._targetCoeff || 3.0);
            this.state.currentCoeff = parseFloat(simCoeff.toFixed(2));
            if (this.onCoeffUpdate) this.onCoeffUpdate(this.state.currentCoeff);
        }
    },

    /**
     * Genere un coefficient de crash realiste
     */
    generateCrashCoeff() {
        const min = 1.00;
        const max = this.config.maxCoeff || 50;
        const avg = this.config.avgCoeff || 3.0;
        const lambda = 1.0 / avg;
        const u = Math.random();
        let coeff = -Math.log(1 - u * 0.999) / lambda;
        coeff = Math.max(min, Math.min(max, coeff));
        this._targetCoeff = coeff;
        return parseFloat(coeff.toFixed(2));
    },

    /**
     * Genere une prediction intelligente
     */
    generatePrediction() {
        const min = 1.10;
        const max = this.config.maxCoeff || 50;
        const avg = this.config.avgCoeff || 3.0;

        // AI Prediction - utilise l'historique si disponible
        let aiCoeff;
        const recentHistory = this.state.lastRounds.slice(-10);
        
        if (recentHistory.length >= 3) {
            // Moyenne ponderee: plus recent = plus important
            const weightedSum = recentHistory.reduce((sum, val, idx) => {
                const weight = (idx + 1) / recentHistory.length;
                return sum + val * weight;
            }, 0);
            const totalWeight = recentHistory.reduce((sum, _, idx) => {
                return sum + (idx + 1) / recentHistory.length;
            }, 0);
            const histAvg = weightedSum / totalWeight;
            
            // Si les derniers rounds etaient bas, predire plus haut (et inversement)
            const trend = recentHistory[recentHistory.length - 1] - recentHistory[0];
            let trendMultiplier = 1.0;
            if (trend < -0.5) trendMultiplier = 1.15; // Trend baissier -> predire hausse
            if (trend > 0.5) trendMultiplier = 0.9;   // Trend haussier -> predire baisse
            
            aiCoeff = histAvg * trendMultiplier * (0.85 + Math.random() * 0.3);
        } else {
            // Pas assez d'historique - prediction standard
            const lambda = 1.0 / avg;
            const u = Math.random() * 0.999;
            aiCoeff = -Math.log(1 - u) / lambda;
        }

        // Bonus aleatoire (15% de chance d'une prediction haute)
        if (Math.random() < 0.15) {
            aiCoeff *= (1.2 + Math.random() * 0.6);
        }

        aiCoeff = Math.max(min, Math.min(max, aiCoeff));
        aiCoeff = parseFloat(aiCoeff.toFixed(2));

        // Manual prediction - un peu plus conservative
        let manualCoeff = aiCoeff * (0.8 + Math.random() * 0.4);
        manualCoeff = Math.max(min, Math.min(max, manualCoeff));
        manualCoeff = parseFloat(manualCoeff.toFixed(2));

        // Confiance
        const diffFromAvg = Math.abs(aiCoeff - avg) / avg;
        let confidence;
        if (diffFromAvg < 0.2) confidence = Math.floor(82 + Math.random() * 15);
        else if (diffFromAvg < 0.5) confidence = Math.floor(68 + Math.random() * 17);
        else if (diffFromAvg < 1.0) confidence = Math.floor(52 + Math.random() * 20);
        else confidence = Math.floor(38 + Math.random() * 22);

        const prediction = {
            ai_prediction: aiCoeff,
            manual_prediction: {
                coeff: manualCoeff,
                confidence: confidence,
            },
            game_state: this.state.gameState,
            timestamp: Date.now(),
        };

        this.state.lastPrediction = prediction;
        this.state.confidence = confidence;

        if (this.onPrediction) {
            this.onPrediction(prediction);
        }

        return prediction;
    },

    /**
     * Force une prediction manuelle
     */
    forcePrediction() {
        return this.generatePrediction();
    },

    /**
     * Genere un UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Recupere l'etat actuel
     */
    getState() {
        return { ...this.state };
    },

    /**
     * Reset
     */
    reset() {
        this.stopPolling();
        this.state = {
            currentCoeff: 0,
            gameState: 'waiting',
            roundId: null,
            predictedForRoundId: null,
            lastPrediction: null,
            lastRounds: [],
            isPolling: false,
            pollTimer: null,
            confidence: 75,
        };
        this._cycleStart = null;
        this._cycleState = null;
        this._cycleDuration = null;
        this._targetCoeff = null;
    },
};

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.GODPredictor = GODPredictor;
}
