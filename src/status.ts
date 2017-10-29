import * as vscode from 'vscode';

interface Hideable {
  show(): void;
  hide(): void;
}

function setVisible<T extends Hideable>(i: T, v: boolean) {
  if (v) {
    i.show();
  } else {
    i.hide();
  }
}

export class StatusBar implements vscode.Disposable {
  private readonly _cmakeToolsStatusItem
      = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3.5);
  private readonly _kitSelectionButton
      = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3.45);
  private readonly _buildButton
      = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3.4);
  private readonly _targetButton
      = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3.3);
  private readonly _warningMessage
      = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3);

  dispose() {
    const items = [
      this._kitSelectionButton,
      this._cmakeToolsStatusItem,
      this._buildButton,
      this._warningMessage,
      this._targetButton,
    ];
    for (const item of items) {
      item.dispose();
    }
  }

  constructor() {
    this._cmakeToolsStatusItem.command = 'cmake.setVariant';
    this._cmakeToolsStatusItem.tooltip = 'Click to select the current build variant';
    this._buildButton.command = 'cmake.build';
    this._kitSelectionButton.command = 'cmake.selectKit';
    this._kitSelectionButton.tooltip = 'Click to change the active kit';
    this._targetButton.command = 'cmake.setDefaultTarget';
    this._targetButton.tooltip = 'Set the active target to build';
    this._reloadBuildButton();
    this.reloadVisibility();
  }

  reloadVisibility() {
    const autovis_items = [
      this._cmakeToolsStatusItem,
      this._buildButton,
      this._kitSelectionButton,
      this._targetButton,
    ];
    for (const item of autovis_items) {
      setVisible(item, this._visible && !!item.text);
    }
  }

  /**
   * Whether the status bar items are visible
   */
  setVisible(v: boolean) {
    this._visible = v;
    this.reloadVisibility();
  }
  private _visible: boolean = true;

  private _reloadStatusButton() {
    this._cmakeToolsStatusItem.text = `CMake: ${this._projectName}: ${this._buildTypeLabel
      }: ${this._statusMessage}`;
    this.reloadVisibility();
  }

  /**
   * The name of the open project
   */
  private _projectName: string = 'Unconfigured Project';
  setProjectName(v: string) {
    this._projectName = v;
    this._reloadStatusButton();
  }

  /**
   * The build type label. Determined by the active build variant
   */
  private _buildTypeLabel: string = 'Unconfigured';
  setBuildTypeLabel(v: string) {
    this._buildTypeLabel = v;
    this._reloadStatusButton();
  }

  /**
   * The message shown in the primary status button. Tells the user what the
   * extension is currently up to.
   */
  private _statusMessage: string = 'Loading...';
  setStatusMessage(v: string) {
    this._statusMessage = v;
    this._reloadStatusButton();
  }

  /**
   * The name of the currently active target to build
   */
  private _targetName : string;
  public get targetName() : string {
    return this._targetName;
  }
  public set targetName(v : string) {
    this._targetName = v;
    this._targetButton.text = `[${v}]`;
    this.reloadVisibility();
  }

  /** Reloads the content of the build button */
  private _reloadBuildButton() {
    this._buildButton.text = ``;
    let progress_bar = '';
    const prog = this._progress;
    if (prog !== null) {
      const bars = prog * 0.4 | 0;
      progress_bar = ` [${Array(bars).join('█')}${Array(40 - bars).join('░')}] ${prog}%`;
    }
    this._buildButton.text = this._isBusy ? `$(x) Stop${progress_bar}` : `$(gear) Build:`;
    this._buildButton.command = this._isBusy ? 'cmake.stop' : 'cmake.build';
    if (this._isBusy) {
      this._buildButton.show();
    }
  }

  /**
   * Whether or not to show a 'Build' or 'Stop' button. Changes the content
   * of the button and the command that is executed when the button is pressed
   */
  private _isBusy: boolean = false;
  setIsBusy(v: boolean) {
    this._isBusy = v;
    this._reloadBuildButton();
  }

  /**
   * The progress of the currently executing task. Updates a primitive progress
   * bar.
   */
  private _progress: number | null = null;
  setProgress(v: number | null) {
    this._progress = v;
    this._reloadBuildButton();
  }

  private _reloadKitsButton() {
    if (this._visible) {
      if (this._activeKitName.length) {
        this._kitSelectionButton.text = this._activeKitName;
      } else {
        this._kitSelectionButton.text = 'No Kit Selected';
      }
      this.reloadVisibility();
    } else {
      this._kitSelectionButton.hide();
    }
  }

  setActiveKitName(v: string) {
    this._activeKitName = v;
    this._reloadKitsButton();
  }
  private _activeKitName: string = '';

  showWarningMessage(msg: string) {
    this._warningMessage.color = 'yellow';
    this._warningMessage.text = `$(alert) ${msg}`;
    this._warningMessage.show();
    setTimeout(() => this._warningMessage.hide(), 5000);
  }
}