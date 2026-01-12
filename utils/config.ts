import { formatErrorMessage } from "../utils/db.ts";

export function handleError(error: unknown, context: string): never {
  const errorMessage = formatErrorMessage(error, context);
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Define configuration types
export interface Config {
  postgresql: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export function parseConfigFile(path: string) {
  // Read configuration from config.json
  let configFile: string;
  try {
    // 从项目根目录读取配置文件，而不是相对于当前文件的目录
    const rootPath = Deno.cwd();
    const configFilePath = `${rootPath}/${path.replace(/^(\.\/|\/)/, "")}`;
    configFile = Deno.readTextFileSync(configFilePath);
  } catch (error: unknown) {
    handleError(error, "reading config.json");
  }

  try {
    const config = JSON.parse(configFile) as Config;
    return config;
  } catch (error: unknown) {
    handleError(error, "parsing config.json");
  }
}
