import {SemVer} from 'semver';
import {getReleaseConfig} from '../../config';
import {ReleaseVersionAndNotesUpdateTask} from './version-and-changelog-update';

(async () => {
  const task = new ReleaseVersionAndNotesUpdateTask(getReleaseConfig());

  await task.stage(new SemVer('12.0.0'), 'release-tasks');
})();
