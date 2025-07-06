import { createOptions } from '@/constants';
import { createApp, listened, startApp } from '@/modules/core/helpers/app';

startApp(createApp(createOptions), listened);
