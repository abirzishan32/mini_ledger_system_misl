using backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));



builder.Services.AddAutoMapper(cfg => { }, typeof(Program).Assembly);


var app = builder.Build();

// When we are in development mode (building the api), we want to enable the Swagger UI so that we can test our endpoints and see the OpenAPI documentation.
if(app.Environment.IsDevelopment())
{
    app.UseSwagger(); // When we use "Use", this is a middleware
    app.UseSwaggerUI();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();

