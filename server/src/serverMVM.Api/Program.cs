using serverMVM.Application.Interfaces;
using serverMVM.Infrastructure.Parsers;
using serverMVM.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers and OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register Clean Architecture Services in DI Container
builder.Services.AddScoped<ILinuxSystemInfoParser, LinuxSystemInfoParser>();
builder.Services.AddScoped<ISshService, SshService>();

// Configure CORS for Frontend integration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

app.Run();
