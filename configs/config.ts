import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const root = process.cwd();

const YAML_CONFIG_PROGRAMS = 'programs.yaml';

export const serverConfig = (): Record<string, any> => {
  const env =
    process.env.NODE_ENV === undefined ? 'development' : process.env.NODE_ENV;

  let configs: string[] = [];
  if (env === 'development') {
    configs = [`${root}/configs/${YAML_CONFIG_PROGRAMS}`];
  } else if (env === 'production') {
    configs = [`${root}/configs/${YAML_CONFIG_PROGRAMS}`];
  } else {
    throw new Error('env error');
  }

  const mergedConfig = configs.reduce((acc, currPath) => {
    try {
      const fileContent = fs.readFileSync(currPath, 'utf8');
      const yamlContent = yaml.load(fileContent) as Record<string, any>;
      return { ...acc, ...yamlContent };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }, {});

  return mergedConfig as Record<string, any>;
};
