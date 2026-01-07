import { EventFactory, IEvent } from '@mbc-cqrs-serverless/core'
import { EventFactoryAddedTask, TaskEvent } from '@mbc-cqrs-serverless/task'
import { Logger } from '@nestjs/common'
import { DynamoDBStreamEvent } from 'aws-lambda'

/**
 * CustomEventFactory extends EventFactoryAddedTask to handle task-related events.
 *
 * This factory processes DynamoDB Stream events and transforms them into
 * domain-specific events. It extends EventFactoryAddedTask to include
 * task processing capabilities.
 *
 * Event flow:
 * 1. DynamoDB Stream triggers this factory with stream events
 * 2. Parent class (EventFactoryAddedTask) processes standard events
 * 3. This class adds TaskEvent processing for the 'tasks' table
 * 4. Events are dispatched to their respective handlers
 *
 * The tasks table DynamoDB Stream is filtered to only process INSERT events,
 * which represent new tasks being created.
 */
@EventFactory()
export class CustomEventFactory extends EventFactoryAddedTask {
  private readonly logger = new Logger(CustomEventFactory.name)

  /**
   * Transform DynamoDB Stream events into application events.
   *
   * @param event - DynamoDB Stream event containing one or more records
   * @returns Array of events to be processed by event handlers
   */
  async transformDynamodbStream(event: DynamoDBStreamEvent): Promise<IEvent[]> {
    // Process standard events from parent class
    const curEvents = await super.transformDynamodbStream(event)

    // Process task events from the 'tasks' table
    const taskEvents = event.Records.map((record) => {
      // Check if this event is from the tasks table
      if (
        record.eventSourceARN.endsWith('tasks') ||
        record.eventSourceARN.includes('tasks' + '/stream/')
      ) {
        // Only process INSERT events (new tasks)
        if (record.eventName === 'INSERT') {
          return new TaskEvent().fromDynamoDBRecord(record)
        }
      }
      return undefined
    }).filter((event) => !!event)

    return [...curEvents, ...taskEvents]
  }
}
