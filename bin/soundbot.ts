#!/usr/bin/env node

import Container from '../src/util/Container';
import localize from '../src/util/i18n/localize';

const { config, soundBot: bot } = Container;

localize.setLocale(config.language);
bot.start();

console.info(localize.t('url', { clientId: config.clientId }));
