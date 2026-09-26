using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using backend.Controllers;
using backend.Data;
using backend.Extensions;
using backend.Filters;
using backend.Interfaces;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Registers ValidateModelAttribute for every action, so no controller repeats the
// ModelState check and none can forget it. Enums cross the wire as their names
// rather than their ordinals — "Asset", not 0 — which is self-describing for the
// client and survives the enum being reordered later.
builder.Services.AddControllers(options => options.Filters.Add<ValidateModelAttribute>())
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));


builder.Services.AddRouting(options => options.LowercaseUrls = true);

// Turns off the framework's automatic 400, which answers with a ProblemDetails
// document. ValidateModelAttribute replaces it so validation failures come back in
// the same ApiResponse shape as everything else.
builder.Services.Configure<ApiBehaviorOptions>(options => options.SuppressModelStateInvalidFilter = true);

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Paste the access token only (Swagger adds the \"Bearer \" prefix).",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});


// Require throws on a missing value, so a misconfigured deployment fails at
// startup by name instead of at the first query or the first token check.
var connectionString = builder.Configuration.Require("ConnectionStrings:DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

var jwtKey = builder.Configuration.Require("AppSettings:Token");

// Validates every bearer token AuthService.CreateToken issued: the signature
// proves this server minted it, and issuer and audience reject one minted for
// something else even if the signing key were ever shared.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration.Require("AppSettings:Issuer"),
            ValidAudience = builder.Configuration.Require("AppSettings:Audience"),
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            // Default is 5 minutes, which would stretch a 15-minute access token to 20.
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();


// Caps how many password checks run at once. BCrypt is deliberately slow, which
// is what makes guessing impractical, and also what would let a flood of sign-ins
// exhaust the server. Rejections answer with the same ApiResponse shape, so a busy
// server is one more handled case for the client rather than a hung request.
builder.Services.AddRateLimiter(options =>
{
    options.AddConcurrencyLimiter(AuthController.BcryptPolicy, limiter =>
    {
        limiter.PermitLimit = Math.Max(2, Environment.ProcessorCount / 2);
        limiter.QueueLimit = Math.Max(2, Environment.ProcessorCount / 2);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<string>.ErrorResponse(
                "The server is busy verifying other sign-ins. Please try again in a moment.",
                StatusCodes.Status429TooManyRequests),
            cancellationToken);
    };
});

builder.Services.AddAutoMapper(cfg => { }, typeof(Program).Assembly);

var app = builder.Build();

// Brings the schema up to date before the first request. A container starts
// against an empty database, so without this the app would come up and then fail
// on its first query. Idempotent: on a database already at the latest migration
// it does nothing, which is what makes restarting safe.
await using (var scope = app.Services.CreateAsyncScope())
{
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}

// Outermost, so it wraps every middleware below. Without it an unhandled
// exception is the one response in the API that is not an ApiResponse, and in
// development it would carry a stack trace to the browser. The exception is
// still logged by the handler itself, which is where a developer should read
// it. The message says nothing about the cause: what failed is not the
// caller's business and naming it leaks implementation detail.
app.UseExceptionHandler(handler => handler.Run(async context =>
{
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;

    await context.Response.WriteAsJsonAsync(ApiResponse<string>.ErrorResponse(
        "Something went wrong on the server. Please try again.",
        StatusCodes.Status500InternalServerError));
}));

// Swagger UI is the only OpenAPI surface here, and only in development.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(); // When we use "Use", this is a middleware
    app.UseSwaggerUI();
}

// Skipped inside a container, which has no HTTPS listener of its own: the
// middleware cannot work out a port to redirect to, so it would redirect nothing
// and log a warning on every request. TLS terminates in front of the container.
if (!app.Configuration.GetValue<bool>("DOTNET_RUNNING_IN_CONTAINER"))
{
    app.UseHttpsRedirection();
}
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization(); // Without this, [Authorize] endpoints throw instead of returning 401.
// Liveness for the container healthcheck. Anonymous, and deliberately does not
// touch the database: it answers whether this process is serving requests, which
// is what compose needs before it starts anything that depends on the API.
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.MapControllers();

app.Run();
