import debug from 'debug';
import page from 'page';
import o from 'component-dom';
import t from 't-component';
import config from '../config/config';
import { restrictUserWithForum } from '../forum-middlewares/forum-middlewares';
import title from '../title/title';
import user from '../user/user';
import ForumForm from '../forum-form/forum-form';

const log = debug('democracyos:forum');
