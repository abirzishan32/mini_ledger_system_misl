using System.Text;
using backend.Data;
using backend.Extensions;
using backend.Interfaces;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// [controller] would otherwise publish /api/Auth; routing matches either case but the
// OpenAPI document should agree with the documented URLs.
builder.Services.AddRouting(options => options.LowercaseUrls = true);

// [ApiController] normally short-circuits invalid models with its own ProblemDetails
// response, which would bypass the ModelState checks in AuthController and return a
// body that is not an ApiResponse<T>. Turning it off keeps one response shape.
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

// Secrets live in user-secrets (dev) or environment variables (ConnectionStrings__DefaultConnection,
// AppSettings__Token) -- never in appsettings.json, which is committed.
var connectionString = builder.Configuration.Require("ConnectionStrings:DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IAuthService, AuthService>();

var jwtKey = builder.Configuration.Require("AppSettings:Token");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            // Required here too: a null ValidIssuer with ValidateIssuer = true rejects
            // every token at request time instead of failing at startup.
            ValidIssuer = builder.Configuration.Require("AppSettings:Issuer"),
            ValidAudience = builder.Configuration.Require("AppSettings:Audience"),
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            // Default is 5 minutes, which would stretch a 15-minute access token to 20.
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddAutoMapper(cfg => { }, typeof(Program).Assembly);

var app = builder.Build();

// Swagger UI is the only OpenAPI surface here, and only in development.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(); // When we use "Use", this is a middleware
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization(); // Without this, [Authorize] endpoints throw instead of returning 401.
app.MapControllers();

app.Run();
