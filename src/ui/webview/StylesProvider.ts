/**
 * Panel-specific style identifiers
 */
export type PanelStyleType = 'companion' | 'onboarding' | 'activity' | 'achievement' | 'notes';

/**
 * Provides shared CSS styles for webview panels.
 * Centralizes styling to ensure consistency across all panels and reduce duplication.
 * All styles are embedded directly to ensure they work in packaged extensions.
 */
export class StylesProvider {
  /**
   * Get panel-specific styles by panel type
   * @param panelType - The type of panel
   * @param _extensionPath - Path to the extension root (kept for backwards compatibility)
   * @returns CSS content for the panel
   */
  public static getPanelStyles(panelType: PanelStyleType, _extensionPath?: string): string {
    switch (panelType) {
      case 'companion':
        return this.getCompanionStyles();
      case 'onboarding':
        return this.getOnboardingStyles();
      case 'activity':
        return this.getActivityStyles();
      case 'achievement':
        return this.getAchievementStyles();
      case 'notes':
        return this.getNotesStyles();
      default:
        return '';
    }
  }

  /**
   * Companion Panel Styles
   */
  private static getCompanionStyles(): string {
    return `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .companion-name {
        font-size: 11px;
        font-weight: 600;
        text-transform: capitalize;
      }

      .level-badge {
        font-size: 10px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
      }

      .message-bubble {
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 8px 12px;
        border-radius: 12px;
        margin-bottom: 8px;
        font-size: 12px;
        text-align: center;
        animation: fadeIn 0.3s ease;
        display: none;
      }

      .message-bubble.visible {
        display: block;
      }

      .xp-bar {
        height: 4px;
        background: var(--vscode-progressBar-background);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .xp-fill {
        height: 100%;
        background: var(--vscode-charts-purple);
        transition: width 0.3s ease;
      }

      .xp-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 8px;
        text-align: center;
      }

      .timer-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .companion {
        width: 56px;
        height: 56px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .companion:hover {
        transform: scale(1.08);
      }

      .timer-info {
        flex: 1;
      }

      .timer-display {
        font-size: 32px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
      }

      .timer-display.idle {
        opacity: 0.4;
      }

      .status {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
      }

      .status.focusing {
        color: var(--vscode-charts-orange);
      }

      .status.break {
        color: var(--vscode-charts-green);
      }

      .controls {
        display: flex;
        gap: 4px;
      }

      .btn {
        border: none;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .btn:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }

      .btn svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }

      .btn.primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        width: auto;
        padding: 0 12px;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
      }

      .btn.primary:hover {
        background: var(--vscode-button-hoverBackground);
      }

      .divider {
        height: 1px;
        background: var(--vscode-widget-border);
        margin: 12px 0;
      }

      .stats-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }

      .stats-label {
        color: var(--vscode-descriptionForeground);
      }

      .stats-value {
        font-weight: 500;
      }

      .dots {
        display: flex;
        gap: 6px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--vscode-widget-border);
      }

      .dot.done {
        background: var(--vscode-charts-green);
      }

      .dot.active {
        background: var(--vscode-charts-yellow);
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(0.9);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
  }

  /**
   * Onboarding Panel Styles
   */
  private static getOnboardingStyles(): string {
    return `
      :root {
        --primary-color: #6366f1;
        --primary-hover: #4f46e5;
        --bg-color: var(--vscode-editor-background);
        --text-color: var(--vscode-editor-foreground);
        --border-color: var(--vscode-input-border);
        --card-bg: var(--vscode-input-background);
        --button-bg: var(--vscode-button-background);
        --button-fg: var(--vscode-button-foreground);
        --button-hover: var(--vscode-button-hoverBackground);
        --secondary-text: var(--vscode-descriptionForeground);
      }

      body {
        font-family: var(--vscode-font-family);
        background-color: var(--bg-color);
        color: var(--text-color);
        padding: 40px;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }

      .onboarding-container {
        max-width: 600px;
        width: 100%;
      }

      .step {
        display: none;
        animation: fadeIn 0.3s ease-in-out;
      }

      .step.active {
        display: block;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .header {
        text-align: center;
        margin-bottom: 32px;
      }

      .header h1 {
        font-size: 28px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .header p {
        color: var(--secondary-text);
        font-size: 16px;
        line-height: 1.6;
      }

      .feature-list {
        list-style: none;
        margin: 24px 0;
      }

      .feature-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        font-size: 16px;
      }

      .feature-list .icon {
        font-size: 24px;
      }

      .companions-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin: 32px 0;
      }

      .companion-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 8px;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--card-bg);
      }

      .companion-option:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
      }

      .companion-option.selected {
        border-color: var(--primary-color);
        background: rgba(99, 102, 241, 0.1);
      }

      .companion-option.locked {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .companion-option.locked:hover {
        transform: none;
        border-color: var(--border-color);
      }

      .companion-option .emoji {
        font-size: 40px;
        margin-bottom: 8px;
      }

      .companion-option .name {
        font-size: 12px;
        color: var(--secondary-text);
      }

      .companion-option .lock-icon {
        font-size: 10px;
        color: var(--secondary-text);
      }

      .unlock-hint {
        text-align: center;
        color: var(--secondary-text);
        font-size: 13px;
        margin-top: -16px;
        margin-bottom: 24px;
      }

      .ai-providers {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 24px 0;
      }

      .ai-provider {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--card-bg);
      }

      .ai-provider:hover {
        border-color: var(--primary-color);
      }

      .ai-provider .icon {
        font-size: 28px;
      }

      .ai-provider .info {
        flex: 1;
      }

      .ai-provider .info .name {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .ai-provider .info .description {
        font-size: 13px;
        color: var(--secondary-text);
      }

      .tips-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin: 24px 0;
      }

      .tip-card {
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        background: var(--card-bg);
      }

      .tip-card .icon {
        font-size: 28px;
        margin-bottom: 12px;
      }

      .tip-card .title {
        font-weight: 600;
        margin-bottom: 6px;
        font-size: 14px;
      }

      .tip-card .description {
        font-size: 13px;
        color: var(--secondary-text);
      }

      .actions {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 32px;
      }

      .btn {
        padding: 12px 28px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: var(--button-bg);
        color: var(--button-fg);
      }

      .btn-primary:hover {
        background: var(--button-hover);
      }

      .btn-secondary {
        background: transparent;
        color: var(--text-color);
        border: 1px solid var(--border-color);
      }

      .btn-secondary:hover {
        background: var(--card-bg);
      }

      .progress-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 32px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--border-color);
        transition: all 0.2s;
      }

      .dot.active {
        background: var(--primary-color);
        width: 24px;
        border-radius: 5px;
      }

      .dot.completed {
        background: var(--primary-color);
      }

      .celebration {
        text-align: center;
        margin: 24px 0;
      }

      .celebration .emoji {
        font-size: 64px;
        animation: bounce 1s ease infinite;
      }

      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
    `;
  }

  /**
   * Activity Dashboard Styles
   */
  private static getActivityStyles(): string {
    return `
      body {
        max-width: 600px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      h1 {
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .btn {
        border: none;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .btn:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }

      .card {
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .card-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 12px;
      }

      .today-time {
        font-size: 36px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 8px;
      }

      .progress-bar {
        height: 8px;
        background: var(--vscode-progressBar-background);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: var(--vscode-charts-blue);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
      }

      .sessions-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
      }

      .sessions-label {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
      }

      .tomato {
        font-size: 16px;
      }

      .tomato.empty {
        opacity: 0.3;
      }

      .divider {
        height: 1px;
        background: var(--vscode-widget-border);
        margin: 12px 0;
      }

      .languages-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .language-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .language-name {
        width: 100px;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .language-bar {
        flex: 1;
        height: 12px;
        background: var(--vscode-progressBar-background);
        border-radius: 3px;
        overflow: hidden;
      }

      .language-bar-fill {
        height: 100%;
        background: var(--vscode-charts-purple);
        border-radius: 3px;
      }

      .language-time {
        width: 60px;
        font-size: 12px;
        text-align: right;
        color: var(--vscode-descriptionForeground);
      }

      .week-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 80px;
        padding-top: 10px;
      }

      .day-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        gap: 4px;
      }

      .bar {
        width: 24px;
        background: var(--vscode-charts-blue);
        border-radius: 3px 3px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
      }

      .bar.today {
        background: var(--vscode-charts-green);
      }

      .day-label {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        line-height: 1;
      }

      .stat-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
      }

      .empty-state {
        text-align: center;
        padding: 24px;
        color: var(--vscode-descriptionForeground);
      }

      .empty-state-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }
    `;
  }

  /**
   * Achievement Panel Styles
   */
  private static getAchievementStyles(): string {
    return `
      body {
        max-width: 700px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      h1 {
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stats-badge {
        font-size: 14px;
        font-weight: 500;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 12px;
        border-radius: 12px;
      }

      .summary-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }

      .summary-card {
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      }

      .summary-icon {
        margin-bottom: 8px;
        color: var(--vscode-textLink-foreground);
      }

      .summary-icon svg {
        display: inline-block;
        vertical-align: middle;
      }

      .summary-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 4px;
      }

      .summary-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
      }

      .category {
        margin-bottom: 24px;
      }

      .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .category-title {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .category-count {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }

      .category-icon {
        font-size: 16px;
      }

      .achievement-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .achievement-item {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 8px;
        padding: 12px 16px;
        transition: all 0.2s ease;
      }

      .achievement-item.locked {
        opacity: 0.6;
      }

      .achievement-item.unlocked {
        border-left: 3px solid var(--vscode-charts-green);
      }

      .achievement-icon {
        font-size: 24px;
        flex-shrink: 0;
        width: 36px;
        text-align: center;
      }

      .achievement-info {
        flex: 1;
        min-width: 0;
      }

      .achievement-name {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .achievement-xp {
        font-size: 10px;
        color: var(--vscode-charts-yellow);
        font-weight: 500;
      }

      .achievement-description {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
      }

      .achievement-status {
        flex-shrink: 0;
        text-align: right;
      }

      .status-unlocked {
        color: var(--vscode-charts-green);
        font-size: 12px;
      }

      .status-date {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
      }

      .progress-bar {
        width: 80px;
        height: 6px;
        background: var(--vscode-progressBar-background);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .progress-fill {
        height: 100%;
        background: var(--vscode-charts-blue);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
      }

      .secret-badge {
        font-size: 10px;
        background: var(--vscode-charts-purple);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .recent-unlocks {
        margin-bottom: 24px;
      }

      .recent-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 8px;
      }

      .recent-list {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .recent-chip {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
      }
    `;
  }

  /**
   * Notes Panel Styles
   */
  private static getNotesStyles(): string {
    return `
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--vscode-widget-border);
      }

      .header h1 {
        font-size: 20px;
        font-weight: 600;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .total-count {
        font-size: 12px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 2px 8px;
        border-radius: 10px;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--vscode-descriptionForeground);
      }

      .empty-state svg {
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-state h2 {
        font-size: 16px;
        margin-bottom: 8px;
      }

      .empty-state p {
        font-size: 13px;
      }

      .file-group {
        margin-bottom: 20px;
      }

      .file-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 6px 6px 0 0;
        font-weight: 500;
        font-size: 12px;
      }

      .file-path {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .note-count {
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 11px;
      }

      .notes-list {
        border: 1px solid var(--vscode-widget-border);
        border-top: none;
        border-radius: 0 0 6px 6px;
      }

      .note-item {
        padding: 12px;
        border-bottom: 1px solid var(--vscode-widget-border);
        cursor: pointer;
        transition: background 0.15s;
      }

      .note-item:last-child {
        border-bottom: none;
      }

      .note-item:hover {
        background: var(--vscode-list-hoverBackground);
      }

      .note-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }

      .note-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        flex-shrink: 0;
        margin-top: 3px;
      }

      .note-content {
        flex: 1;
        min-width: 0;
      }

      .note-text {
        font-size: 13px;
        margin-bottom: 4px;
        word-wrap: break-word;
      }

      .note-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }

      .note-location {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .code-preview {
        background: var(--vscode-textCodeBlock-background);
        border-radius: 4px;
        padding: 8px;
        margin-top: 8px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 80px;
        overflow-y: auto;
      }

      .note-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s;
      }

      .note-item:hover .note-actions {
        opacity: 1;
      }

      .action-btn {
        border: none;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-btn:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }

      .action-btn.danger:hover {
        background: var(--vscode-errorBackground);
        color: var(--vscode-errorForeground);
      }
    `;
  }

  /**
   * Get combined styles for a panel (base + component + panel-specific)
   * @param panelType - The type of panel
   * @param extensionPath - Path to the extension root
   * @returns Combined CSS content
   */
  public static getCombinedStyles(panelType: PanelStyleType, extensionPath: string): string {
    return `
      ${this.getBaseStyles()}
      ${this.getComponentStyles()}
      ${this.getAnimationStyles()}
      ${this.getPanelStyles(panelType, extensionPath)}
    `;
  }

  /**
   * Get base CSS variables and reset styles.
   * These should be included in every webview panel.
   */
  public static getBaseStyles(): string {
    return `
			/* CSS Variables for theming */
			:root {
				--container-padding: 20px;
				--input-padding: 8px 12px;
				--border-radius: 6px;
				--transition-speed: 0.2s;
				
				/* VS Code theme colors */
				--vscode-font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
				--background: var(--vscode-editor-background);
				--foreground: var(--vscode-editor-foreground);
				--border-color: var(--vscode-panel-border);
				--hover-background: var(--vscode-list-hoverBackground);
				--active-background: var(--vscode-list-activeSelectionBackground);
				--button-background: var(--vscode-button-background);
				--button-foreground: var(--vscode-button-foreground);
				--button-hover-background: var(--vscode-button-hoverBackground);
				--input-background: var(--vscode-input-background);
				--input-foreground: var(--vscode-input-foreground);
				--input-border: var(--vscode-input-border);
				--link-color: var(--vscode-textLink-foreground);
				--link-active-color: var(--vscode-textLink-activeForeground);
			}

			/* Reset and base styles */
			* {
				box-sizing: border-box;
				margin: 0;
				padding: 0;
			}

			body {
				font-family: var(--vscode-font-family);
				font-size: var(--vscode-font-size, 13px);
				color: var(--foreground);
				background-color: var(--background);
				line-height: 1.6;
				padding: var(--container-padding);
			}

			h1, h2, h3, h4, h5, h6 {
				font-weight: 600;
				line-height: 1.3;
				margin-bottom: 0.5em;
			}

			h1 { font-size: 2em; }
			h2 { font-size: 1.5em; }
			h3 { font-size: 1.25em; }

			p {
				margin-bottom: 1em;
			}

			a {
				color: var(--link-color);
				text-decoration: none;
				cursor: pointer;
			}

			a:hover {
				color: var(--link-active-color);
				text-decoration: underline;
			}

			code {
				font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
				background-color: var(--vscode-textCodeBlock-background);
				padding: 2px 4px;
				border-radius: 3px;
				font-size: 0.9em;
			}

			pre {
				background-color: var(--vscode-textCodeBlock-background);
				padding: 12px;
				border-radius: var(--border-radius);
				overflow-x: auto;
				margin-bottom: 1em;
			}

			pre code {
				background: none;
				padding: 0;
			}
		`;
  }

  /**
   * Get common component styles (buttons, inputs, cards, etc.)
   */
  public static getComponentStyles(): string {
    return `
			/* Button styles */
			.button, button {
				background-color: var(--button-background);
				color: var(--button-foreground);
				border: none;
				padding: var(--input-padding);
				border-radius: var(--border-radius);
				cursor: pointer;
				font-size: inherit;
				font-family: inherit;
				transition: background-color var(--transition-speed);
				display: inline-flex;
				align-items: center;
				justify-content: center;
				gap: 6px;
			}

			.button:hover, button:hover {
				background-color: var(--button-hover-background);
			}

			.button:active, button:active {
				opacity: 0.8;
			}

			.button:disabled, button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			.button-secondary {
				background-color: var(--vscode-button-secondaryBackground);
				color: var(--vscode-button-secondaryForeground);
			}

			.button-secondary:hover {
				background-color: var(--vscode-button-secondaryHoverBackground);
			}

			/* Input styles */
			input[type="text"],
			input[type="email"],
			input[type="password"],
			input[type="number"],
			input[type="date"],
			textarea,
			select {
				background-color: var(--input-background);
				color: var(--input-foreground);
				border: 1px solid var(--input-border, transparent);
				padding: var(--input-padding);
				border-radius: var(--border-radius);
				font-size: inherit;
				font-family: inherit;
				width: 100%;
				transition: border-color var(--transition-speed);
			}

			input:focus,
			textarea:focus,
			select:focus {
				outline: 1px solid var(--vscode-focusBorder);
				border-color: var(--vscode-focusBorder);
			}

			/* Card/Container styles */
			.card {
				background-color: var(--vscode-editor-background);
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius);
				padding: 16px;
				margin-bottom: 16px;
			}

			.card-header {
				font-weight: 600;
				margin-bottom: 12px;
				padding-bottom: 8px;
				border-bottom: 1px solid var(--border-color);
			}

			/* List styles */
			.list {
				list-style: none;
			}

			.list-item {
				padding: 8px 12px;
				border-radius: var(--border-radius);
				cursor: pointer;
				transition: background-color var(--transition-speed);
			}

			.list-item:hover {
				background-color: var(--hover-background);
			}

			.list-item.active {
				background-color: var(--active-background);
			}

			/* Badge styles */
			.badge {
				display: inline-block;
				padding: 2px 8px;
				border-radius: 12px;
				font-size: 0.85em;
				font-weight: 500;
				background-color: var(--vscode-badge-background);
				color: var(--vscode-badge-foreground);
			}

			/* Utility classes */
			.flex {
				display: flex;
			}

			.flex-column {
				flex-direction: column;
			}

			.gap-small {
				gap: 8px;
			}

			.gap-medium {
				gap: 16px;
			}

			.gap-large {
				gap: 24px;
			}

			.items-center {
				align-items: center;
			}

			.justify-between {
				justify-content: space-between;
			}

			.justify-center {
				justify-content: center;
			}

			.text-center {
				text-align: center;
			}

			.text-muted {
				color: var(--vscode-descriptionForeground);
			}

			.text-small {
				font-size: 0.9em;
			}

			.mt-1 { margin-top: 8px; }
			.mt-2 { margin-top: 16px; }
			.mt-3 { margin-top: 24px; }
			.mb-1 { margin-bottom: 8px; }
			.mb-2 { margin-bottom: 16px; }
			.mb-3 { margin-bottom: 24px; }

			.hidden {
				display: none !important;
			}

			/* Scrollbar styles */
			::-webkit-scrollbar {
				width: 10px;
				height: 10px;
			}

			::-webkit-scrollbar-track {
				background: var(--vscode-scrollbarSlider-background);
			}

			::-webkit-scrollbar-thumb {
				background: var(--vscode-scrollbarSlider-background);
				border-radius: 5px;
			}

			::-webkit-scrollbar-thumb:hover {
				background: var(--vscode-scrollbarSlider-hoverBackground);
			}
		`;
  }

  /**
   * Get animation styles for interactive elements
   */
  public static getAnimationStyles(): string {
    return `
			@keyframes fadeIn {
				from { opacity: 0; }
				to { opacity: 1; }
			}

			@keyframes slideIn {
				from {
					transform: translateY(-10px);
					opacity: 0;
				}
				to {
					transform: translateY(0);
					opacity: 1;
				}
			}

			@keyframes pulse {
				0%, 100% { opacity: 1; }
				50% { opacity: 0.5; }
			}

			.fade-in {
				animation: fadeIn var(--transition-speed) ease-out;
			}

			.slide-in {
				animation: slideIn 0.3s ease-out;
			}

			.pulse {
				animation: pulse 1.5s ease-in-out infinite;
			}

			.loading {
				position: relative;
				pointer-events: none;
				opacity: 0.6;
			}

			.loading::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 20px;
				height: 20px;
				margin: -10px 0 0 -10px;
				border: 2px solid var(--vscode-progressBar-background);
				border-radius: 50%;
				border-top-color: transparent;
				animation: spin 0.6s linear infinite;
			}

			@keyframes spin {
				to { transform: rotate(360deg); }
			}
		`;
  }

  /**
   * Get all styles combined
   */
  public static getAllStyles(): string {
    return `
			<style>
				${this.getBaseStyles()}
				${this.getComponentStyles()}
				${this.getAnimationStyles()}
			</style>
		`;
  }

  /**
   * Get Content Security Policy meta tag
   *
   * @param nonce - Nonce value for inline scripts
   */
  public static getCSP(nonce: string): string {
    return `
			<meta http-equiv="Content-Security-Policy" 
				content="default-src 'none'; 
				style-src 'unsafe-inline'; 
				script-src 'nonce-${nonce}'; 
				img-src vscode-resource: https:; 
				font-src vscode-resource:;">
		`;
  }
}
