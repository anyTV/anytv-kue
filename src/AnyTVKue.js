'use strict';

import kue from 'kue';
import _ from 'lodash';
import winston from 'winston';

class AnyTVKue {

    constructor (config) {
        this.baseConfig = config || {};
        this.Queue = kue;

        _.defaults(this, kue);
    }

    createQueue () {
        const self = this;

        this.queue = kue.createQueue();

        this.queue._create = this.queue.create;

        this.queue.create = function () {
            const createResult = self.queue._create.apply(this, arguments);

            createResult._save = createResult.save;

            createResult.save = function () {
                createResult.removeOnComplete(!!self.baseConfig.removeOnComplete);
                createResult._save();
            };

            return createResult;
        };

        return this.queue;
    }

    setup (target, callbacks) {
        callbacks = callbacks || {};

        target.on('error', callbacks.error || (err => {
            winston.log('error', 'QUEUE ERROR:', err);
        }));

        target.on('job failed', callbacks.failed || ((err) => {
            winston.log('error', 'FAILED JOB:', err);
        }));

        process.once('SIGTERM', callbacks.sigterm || (sig => {
            winston.log('SIGTERM', sig);
            target.shutdown(this.baseConfig.shutdownTimer || 5000, err => {
                winston.log('error', 'Kue shutdown:', err );
                process.exit(0);
            });
        }));

        const status = ['active', 'inactive'];

        //requeue all active and inactive jobs
        status.forEach(stat => {
            target[stat](callbacks[stat] || ((err, ids) => {
                ids.forEach(id => {
                    kue.Job.get(id, (_err, job) => {
                        job.inactive();
                    });
                });
            }));
        });
    }

    cleanup (job_name, status) {
        kue.Job.rangeByType(job_name, status || 'complete', 0, -1, 'asc', (err, selectedJobs) => {
            if (selectedJobs && selectedJobs.length) {
                selectedJobs.forEach(job => {
                    job.remove();
                });
            }
        });
    }
}

export default AnyTVKue;
