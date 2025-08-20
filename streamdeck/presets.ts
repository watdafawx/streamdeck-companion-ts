/**
 * StreamDeck Companion Presets
 * 
 * Pre-configured button layouts and functions for common use cases
 */

import { StreamDeckClient } from './client';
import { ButtonPosition, ButtonStyle } from './types';
import { COLORS, BUTTON_PRESETS, createButtonStyle, formatNumber } from './utils';

// =============================================================================
// ESPORTS PRESETS
// =============================================================================

export interface EsportsMatchData {
  leftTeam: {
    name: string;
    score: number;
    color?: string;
  };
  rightTeam: {
    name: string;
    score: number;
    color?: string;
  };
  round: number;
  timer: string;
  status: 'live' | 'paused' | 'ended';
}

export interface PlayerStats {
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  adr?: number;
  alive: boolean;
}

/**
 * Create esports scoreboard layout
 */
export async function createEsportsScoreboard(
  client: StreamDeckClient,
  page: number,
  matchData: EsportsMatchData
): Promise<void> {
  // Left team score (position 0,0)
  await client.updateButtonStyleBody(
    { page, row: 0, column: 0 },
    createButtonStyle('TEAM_LEFT', {
      text: matchData.leftTeam.name.slice(0, 6),
      bgcolor: matchData.leftTeam.color || COLORS.STREAMDECK_BLUE
    })
  );

  // Left team score (position 0,1)
  await client.updateButtonStyleBody(
    { page, row: 0, column: 1 },
    createButtonStyle('SCORE', {
      text: matchData.leftTeam.score.toString()
    })
  );

  // Timer/Round info (position 0,2)
  await client.updateButtonStyleBody(
    { page, row: 0, column: 2 },
    createButtonStyle('TIMER', {
      text: `R${matchData.round}\n${matchData.timer}`
    })
  );

  // Right team score (position 0,3)
  await client.updateButtonStyleBody(
    { page, row: 0, column: 3 },
    createButtonStyle('SCORE', {
      text: matchData.rightTeam.score.toString()
    })
  );

  // Right team name (position 0,4)
  await client.updateButtonStyleBody(
    { page, row: 0, column: 4 },
    createButtonStyle('TEAM_RIGHT', {
      text: matchData.rightTeam.name.slice(0, 6),
      bgcolor: matchData.rightTeam.color || COLORS.STREAMDECK_RED
    })
  );

  // Status indicator (position 1,2)
  const statusColor = matchData.status === 'live' ? (COLORS.SUCCESS as string) : 
                     matchData.status === 'paused' ? (COLORS.WARNING as string) : (COLORS.ERROR as string);
  
  await client.updateButtonStyleBody(
    { page, row: 1, column: 2 },
    createButtonStyle('DEFAULT', {
      text: matchData.status.toUpperCase(),
      bgcolor: statusColor
    })
  );
}

/**
 * Create player stats display
 */
export async function createPlayerStats(
  client: StreamDeckClient,
  page: number,
  players: PlayerStats[],
  startRow: number = 2
): Promise<void> {
  for (let i = 0; i < Math.min(players.length, 10); i++) {
    const player = players[i];
    const row = startRow + Math.floor(i / 5);
    const col = i % 5;
    
    const kda = `${player.kills}/${player.deaths}/${player.assists}`;
    const adrText = player.adr ? `\n${player.adr}` : '';
    
    await client.updateButtonStyleBody(
      { page, row, column: col },
      createButtonStyle(player.alive ? 'ACTIVE' : 'INACTIVE', {
        text: `${player.name.slice(0, 4)}\n${kda}${adrText}`,
        size: 8
      })
    );
  }
}

// =============================================================================
// MEDIA CONTROL PRESETS
// =============================================================================

export interface MediaControls {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrack?: string;
}

/**
 * Create media control layout
 */
export async function createMediaControls(
  client: StreamDeckClient,
  page: number,
  controls: MediaControls,
  startRow: number = 0
): Promise<void> {
  const row = startRow;
  
  // Previous track
  await client.updateButtonStyleBody(
    { page, row, column: 0 },
    createButtonStyle('DEFAULT', { text: '⏮️' })
  );
  
  // Play/Pause
  await client.updateButtonStyleBody(
    { page, row, column: 1 },
    createButtonStyle(controls.isPlaying ? 'SUCCESS' : 'WARNING', {
      text: controls.isPlaying ? '⏸️' : '▶️'
    })
  );
  
  // Next track
  await client.updateButtonStyleBody(
    { page, row, column: 2 },
    createButtonStyle('DEFAULT', { text: '⏭️' })
  );
  
  // Mute toggle
  await client.updateButtonStyleBody(
    { page, row, column: 3 },
    createButtonStyle(controls.isMuted ? 'ERROR' : 'DEFAULT', {
      text: controls.isMuted ? '🔇' : '🔊'
    })
  );
  
  // Volume display
  await client.updateButtonStyleBody(
    { page, row, column: 4 },
    createButtonStyle('DEFAULT', {
      text: `VOL\n${controls.volume}%`,
      size: 10
    })
  );
  
  // Current track (if available)
  if (controls.currentTrack && startRow + 1 < 8) {
    await client.updateButtonStyleBody(
      { page, row: startRow + 1, column: 0 },
      createButtonStyle('INFO', {
        text: controls.currentTrack.slice(0, 8),
        size: 8
      })
    );
  }
}

// =============================================================================
// STREAMING PRESETS
// =============================================================================

export interface StreamingStatus {
  isLive: boolean;
  isRecording: boolean;
  viewers: number;
  uptime: string;
  bitrate: number;
  fps: number;
}

/**
 * Create streaming dashboard
 */
export async function createStreamingDashboard(
  client: StreamDeckClient,
  page: number,
  status: StreamingStatus
): Promise<void> {
  // Live indicator
  await client.updateButtonStyleBody(
    { page, row: 0, column: 0 },
    createButtonStyle(status.isLive ? 'ERROR' : 'INACTIVE', {
      text: status.isLive ? 'LIVE' : 'OFF',
      size: 16
    })
  );
  
  // Recording indicator
  await client.updateButtonStyleBody(
    { page, row: 0, column: 1 },
    createButtonStyle(status.isRecording ? 'WARNING' : 'INACTIVE', {
      text: status.isRecording ? 'REC' : 'STOP',
      size: 14
    })
  );
  
  // Viewer count
  await client.updateButtonStyleBody(
    { page, row: 0, column: 2 },
    createButtonStyle('INFO', {
      text: `👁️\n${formatNumber(status.viewers)}`,
      size: 12
    })
  );
  
  // Uptime
  await client.updateButtonStyleBody(
    { page, row: 0, column: 3 },
    createButtonStyle('DEFAULT', {
      text: `⏱️\n${status.uptime}`,
      size: 10
    })
  );
  
  // Technical stats
  await client.updateButtonStyleBody(
    { page, row: 1, column: 0 },
    createButtonStyle('DEFAULT', {
      text: `${status.bitrate}k\n${status.fps}fps`,
      size: 10
    })
  );
}

// =============================================================================
// SYSTEM MONITORING PRESETS
// =============================================================================

export interface SystemStats {
  cpu: number;
  memory: number;
  gpu?: number;
  temperature?: number;
  network: {
    upload: number;
    download: number;
  };
}

/**
 * Create system monitoring display
 */
export async function createSystemMonitor(
  client: StreamDeckClient,
  page: number,
  stats: SystemStats,
  startRow: number = 0
): Promise<void> {
  const row = startRow;
  
  // CPU usage
  const cpuColor = stats.cpu > 80 ? (COLORS.ERROR as string) : 
                   stats.cpu > 60 ? (COLORS.WARNING as string) : (COLORS.SUCCESS as string);
  
  await client.updateButtonStyleBody(
    { page, row, column: 0 },
    createButtonStyle('DEFAULT', {
      text: `CPU\n${stats.cpu}%`,
      bgcolor: cpuColor,
      color: COLORS.WHITE,
      size: 12
    })
  );
  
  // Memory usage
  const memColor = stats.memory > 80 ? (COLORS.ERROR as string) : 
                   stats.memory > 60 ? (COLORS.WARNING as string) : (COLORS.SUCCESS as string);
  
  await client.updateButtonStyleBody(
    { page, row, column: 1 },
    createButtonStyle('DEFAULT', {
      text: `RAM\n${stats.memory}%`,
      bgcolor: memColor,
      color: COLORS.WHITE,
      size: 12
    })
  );
  
  // GPU usage (if available)
  if (stats.gpu !== undefined) {
  const gpuColor = stats.gpu > 80 ? (COLORS.ERROR as string) : 
           stats.gpu > 60 ? (COLORS.WARNING as string) : (COLORS.SUCCESS as string);
    
    await client.updateButtonStyleBody(
      { page, row, column: 2 },
      createButtonStyle('DEFAULT', {
        text: `GPU\n${stats.gpu}%`,
        bgcolor: gpuColor,
        color: COLORS.WHITE,
        size: 12
      })
    );
  }
  
  // Temperature (if available)
  if (stats.temperature !== undefined) {
  const tempColor = stats.temperature > 80 ? (COLORS.ERROR as string) : 
            stats.temperature > 70 ? (COLORS.WARNING as string) : (COLORS.SUCCESS as string);
    
    await client.updateButtonStyleBody(
      { page, row, column: 3 },
      createButtonStyle('DEFAULT', {
        text: `TEMP\n${stats.temperature}°C`,
        bgcolor: tempColor,
        color: COLORS.WHITE,
        size: 10
      })
    );
  }
  
  // Network stats
  await client.updateButtonStyleBody(
    { page, row, column: 4 },
    createButtonStyle('INFO', {
      text: `NET\n↑${formatNumber(stats.network.upload)}\n↓${formatNumber(stats.network.download)}`,
      size: 8
    })
  );
}

// =============================================================================
// TIMER PRESETS
// =============================================================================

export interface TimerConfig {
  duration: number; // in seconds
  label: string;
  warningThreshold?: number; // seconds remaining to show warning
  criticalThreshold?: number; // seconds remaining to show critical
}

/**
 * Create countdown timer display
 */
export async function createCountdownTimer(
  client: StreamDeckClient,
  position: ButtonPosition,
  remainingSeconds: number,
  config: TimerConfig
): Promise<void> {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  let bgcolor: string = COLORS.SUCCESS as string;
  
  if (config.criticalThreshold && remainingSeconds <= config.criticalThreshold) {
    bgcolor = COLORS.ERROR;
  } else if (config.warningThreshold && remainingSeconds <= config.warningThreshold) {
    bgcolor = COLORS.WARNING;
  }
  
  await client.updateButtonStyleBody(position, {
    text: `${config.label}\n${timeText}`,
    bgcolor,
    color: COLORS.WHITE,
    size: 12
  });
}

// =============================================================================
// SOCIAL MEDIA PRESETS
// =============================================================================

export interface SocialStats {
  platform: string;
  followers: number;
  likes?: number;
  shares?: number;
  comments?: number;
}

/**
 * Create social media stats display
 */
export async function createSocialStats(
  client: StreamDeckClient,
  page: number,
  stats: SocialStats[],
  startRow: number = 0
): Promise<void> {
  for (let i = 0; i < Math.min(stats.length, 5); i++) {
    const stat = stats[i];
    const position = { page, row: startRow, column: i };
    
    const platformEmoji = {
      'twitter': '🐦',
      'youtube': '📺',
      'twitch': '🎮',
      'instagram': '📸',
      'tiktok': '🎵',
      'facebook': '📘'
    }[stat.platform.toLowerCase()] || '📱';
    
    await client.updateButtonStyleBody(position, {
      text: `${platformEmoji}\n${formatNumber(stat.followers)}`,
      bgcolor: COLORS.DARK_BLUE,
      color: COLORS.WHITE,
      size: 10
    });
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a simple toggle button
 */
export async function createToggleButton(
  client: StreamDeckClient,
  position: ButtonPosition,
  label: string,
  isActive: boolean,
  activeColor: string = COLORS.SUCCESS,
  inactiveColor: string = COLORS.GRAY
): Promise<void> {
  await client.updateButtonStyleBody(position, {
    text: label,
    bgcolor: isActive ? activeColor : inactiveColor,
    color: COLORS.WHITE,
    size: 12
  });
}

/**
 * Create a progress bar button
 */
export async function createProgressButton(
  client: StreamDeckClient,
  position: ButtonPosition,
  label: string,
  percentage: number,
  maxValue: number = 100
): Promise<void> {
  const progress = Math.min(100, Math.max(0, (percentage / maxValue) * 100));
  const barLength = 8;
  const filledBars = Math.round((progress / 100) * barLength);
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
  
  let color: string = COLORS.SUCCESS as string;
  if (progress > 80) color = COLORS.ERROR;
  else if (progress > 60) color = COLORS.WARNING;
  
  await client.updateButtonStyleBody(position, {
    text: `${label}\n${progressBar}\n${Math.round(progress)}%`,
    bgcolor: COLORS.DARK_GRAY,
    color: color,
    size: 8
  });
}
