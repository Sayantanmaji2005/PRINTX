import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@/types';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the handler already returned an ApiResponse format
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return {
            ...res,
            timestamp: new Date().toISOString(),
          };
        }

        const message =
          res && typeof res === 'object' && 'message' in res
            ? (res as any).message
            : 'Operation successful';

        const data =
          res && typeof res === 'object' && 'data' in res
            ? (res as any).data
            : res;

        return {
          success: true,
          message,
          data: data !== undefined ? data : null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
