# anytv-kue

Kue Helper for setup and cleanup of Kue

# Changes to be made to old codes

1. Replace all `require('kue');` with
1. **NOTE:** Define namespace when calling createQueue to ensure properly scheduling for multiple applications. ex

    ```javascript
        const kue = require('anytv-kue')();
        const queue = kue.createQueue({
            prefix: 'namespace'
        });
    ```

# Added features
- Setup kue

    ```javascript
    // server.js (before)
    const kue = require('anytv-kue')();
    const queue = kue.createQueue();

    function start () {
        /* server code */
    }

    queue.on('error', err => {
        winston.log('error', 'QUEUE ERROR:', err);
    });

    process.once('SIGTERM', sig => {
        winston.log('SIGTERM', sig);
        queue.shutdown(5000, err => {
            winston.log('error', 'Kue shutdown:', err );
            process.exit(0);
        });
    });

    queue.active((err, ids) => {
        ids.forEach(id => {
            kue.Job.get(id, (_err, job) => {
                job.inactive();
            });
        });
    });

    queue.inactive((err, ids) => {
        ids.forEach(id => {
            kue.Job.get(id, (_err, job) => {
                job.inactive();
            });
        });
    });

    start();

    ```
    ```javascript
    // server.js (now)
    const kue = require('antv-kue')();
    const queue = kue.createQueue();

    function start () {
        /* server code */
    }

    kue.setup(queue);

    start();

    ```
- Activate UI
    ```javascript
        const kue = require('anytv-kue')();
        const queue = kue.createQueue({remove_on_complete:false});
        const express = require('express');
        const app = express();

        //activates UI without auth in `/kue`
        kue.activateUI(app)();
        //activates UI in route `/kueapp` without auth
        kue.activateUI(app)('/kueapp');
        //activates UI with basic auth in `/kue`
        kue.activateUI(app, 'username', 'password')();
        //activates UI with basic auth in `/kueapp`
        kue.activateUI(app, 'username', 'password')('/kueapp');
        //activates UI with custom middleware in `/kue`
        kue.activateUI(app, middleWare)();
        //activates UI with custom middleware in `/kueapp`
        kue.activateUI(app, middleWare)('/kueapp');
    ```
- Default Title
    ```javascript
        const kue = require('anytv-kue')();
        const queue = kue.createQueue();

        queue.create('jobtitle', { test: 123 })
            .save(); //default title will be "{ test: 123 }"

        queue.create('jobtitle', { test: 123, title: '123'})
            .save(); //title will be "123"

        queue.create('jobtitle')
            .save(); //title will be "undefined"
    ```
- Cleanup jobs

    ```javascript
        kue.cleanup(job_type, status);
    ```

- Remove jobs on complete
    ```javascript
      // before
      const kue = require('kue');
      const queue = kue.createQueue();

      queue.create('name', {})
        .removeOnComplete(true)
        .save();

      queue.create('name2', {})
        .removeOnComplete(true)
        .save();
    ```
    ```javascript
      //now
      const kue = require('anytv-kue')({shutdownTimer: 10000});
      const queue = kue.createQueue({remove_on_complete: true});

      queue.create('name', {})
        .save();

      queue.create('name2', {})
        .save();
    ```

# Available configurations

## constructor
- `shutdownTimer` - time alotted for graceful shutdown

## options
- `remove_on_complete` - will Kue remove data from redis when job is complete
- for other options, check out: https://github.com/lykmapipo/kue-scheduler#options

## setup

```javascript
kue.setup(queue, callbacks);
```

- `queue` - the queue we want to listen to (usually the return of `kue.createQueue`)
- `callbacks` - there are 5 callbacks available
    ```javascript
    {
      //called when there is an error in redis queue
      error: function (err) {

      },

      //called when a job failed altogethere after alotted attempts
      failed: function (jobid) {

      },

      //called when a process SIGTERM occurs
      sigterm: function (sig) {

      },

      //called upon setup, control what you want to do with active jobs
      active: function (err, ids) {

      },

      //called upon setup, control what you want to do with inactive jobs
      inactive: function (err, ids) {

      }
    }
    ```

#How To's

## Update Delayed jobs
```javascript
    'use strict';

    const kue = require('kue');
    const queue = kue.createQueue();

    queue.delayed(function (err, selectedJobs) {
        selectedJobs.forEach(function (id) {
            kue.Job.get(id, function (err, job) {
                if (!job.removeOnComplete()) {
                    job.removeOnComplete(true).update();
                }
            });
        });
    });
```
    
`.update()` on a `Job` object will update it. this is an undocumented of [Kue](http://automattic.github.io/kue/)

# Contributing Guidelines
Please read [CONTRIBUTING.md](CONTRIBUTING.md)
