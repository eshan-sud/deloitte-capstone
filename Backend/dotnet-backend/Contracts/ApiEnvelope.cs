namespace aspnet_backend.Contracts;

public sealed record ApiEnvelope<T>(
    bool Success,
    string Message,
    T? Data,
    DateTimeOffset Timestamp,
    object? Errors = null)
{
    public static ApiEnvelope<T> Ok(T data, string message = "Request completed successfully.")
    {
        return new ApiEnvelope<T>(
            Success: true,
            Message: message,
            Data: data,
            Timestamp: DateTimeOffset.UtcNow);
    }

    public static ApiEnvelope<T> Fail(string message, object? errors = null)
    {
        return new ApiEnvelope<T>(
            Success: false,
            Message: message,
            Data: default,
            Timestamp: DateTimeOffset.UtcNow,
            Errors: errors);
    }
}
