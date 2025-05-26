/**
 * Утилита для логирования действий пользователя и ошибок
 *
 * Предоставляет единый интерфейс для логирования с разными уровнями важности,
 * форматированием и возможностью сохранения логов в файл или базу данных.
 */

// Уровни логирования
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

// Типы логов
export enum LogType {
  SYSTEM = "SYSTEM",
  DATABASE = "database",
  TELEGRAM_API = "telegram_api",
  GRAPHQL_API = "graphql_api",
  EXTERNAL_SERVICE = "external_service",
  BUSINESS_LOGIC = "business_logic",
  USER_ACTION = "USER_ACTION",
  SCENE = "scene",
  NETWORK = "network",
  PERFORMANCE = "performance",
  TEST = "test",
  WARNING = "warning",
}

// Интерфейс для записи лога
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  type: LogType;
  message: string;
  userId?: number | string;
  username?: string;
  data?: any;
  error?: Error;
  query?: string;
  documentLength?: number;
  resultsCount?: number;
  responseLength?: number;
  textLength?: number;
  hasDocument?: boolean;
  hasToken?: boolean;
}

interface LogConfig {
  logToConsole: boolean;
  logToFile: boolean;
  logToDatabase: boolean;
  minLevel: LogLevel;
}

// Класс логгера
export class Logger {
  private static instance: Logger;
  private config: LogConfig = {
    logToConsole: true,
    logToFile: false,
    logToDatabase: false,
    minLevel: LogLevel.INFO,
  };

  // Приватный конструктор для синглтона
  private constructor() {}

  // Получение экземпляра логгера
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Настройка логгера
  public configure(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Логирование
  public log(entry: LogEntry) {
    if (!this.config.logToConsole) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${entry.level}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.config.minLevel === LogLevel.DEBUG) {
          console.debug(logMessage, entry);
        }
        break;
      case LogLevel.INFO:
        if ([LogLevel.DEBUG, LogLevel.INFO].includes(this.config.minLevel)) {
          console.info(logMessage, entry);
        }
        break;
      case LogLevel.WARN:
        if ([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN].includes(this.config.minLevel)) {
          console.warn(logMessage, entry);
        }
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, entry);
        break;
    }
  }

  // Вспомогательные методы для разных уровней логирования

  public debug(message: string, meta: Partial<LogEntry> = {}) {
    this.log({
      timestamp: new Date(),
      message, 
      level: LogLevel.DEBUG,
      type: LogType.SYSTEM, 
      ...meta 
    });
  }

  public info(message: string, meta: Partial<LogEntry> = {}) {
    this.log({
      timestamp: new Date(),
      message, 
      level: LogLevel.INFO,
      type: LogType.SYSTEM, 
      ...meta 
    });
  }

  public warn(message: string, meta: Partial<LogEntry> = {}) {
    this.log({
      timestamp: new Date(),
      message, 
      level: LogLevel.WARN,
      type: LogType.SYSTEM, 
      ...meta 
    });
  }

  public error(message: string, meta: Partial<LogEntry> = {}) {
    this.log({
      timestamp: new Date(),
      message, 
      level: LogLevel.ERROR,
      type: LogType.SYSTEM, 
      ...meta 
    });
  }

  public fatal(message: string, meta: Partial<LogEntry> = {}) {
    this.log({
      timestamp: new Date(),
      message, 
      level: LogLevel.FATAL,
      type: LogType.SYSTEM, 
      ...meta 
    });
  }

  // Логирование действий пользователя
  public userAction(
    message: string,
    options?: Omit<LogEntry, "timestamp" | "level" | "type" | "message">
  ) {
    this.log({
      timestamp: new Date(),
      level: LogLevel.INFO,
      type: LogType.USER_ACTION,
      message,
      ...options,
    });
  }

  // Логирование действий бота
  public botAction(
    message: string,
    options?: Omit<LogEntry, "timestamp" | "level" | "type" | "message">
  ) {
    this.log({
      timestamp: new Date(),
      level: LogLevel.INFO,
      type: LogType.SYSTEM,
      message,
      ...options,
    });
  }
}

// Экспортируем экземпляр логгера
export const logger = Logger.getInstance();
