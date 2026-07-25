using serverMVM.Api.Hubs;
using serverMVM.Application.Interfaces;
using serverMVM.Infrastructure.Parsers;
using serverMVM.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers, OpenAPI, and SignalR
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

// Register Clean Architecture Services in DI Container
builder.Services.AddScoped<ILinuxSystemInfoParser, LinuxSystemInfoParser>();
builder.Services.AddScoped<ISshService, SshService>();
builder.Services.AddSingleton<ISshTerminalManager, SshTerminalManager>();
builder.Services.AddScoped<IDockerService, DockerService>();
builder.Services.AddScoped<IDockerComposeDiscoveryService, DockerComposeDiscoveryService>();
builder.Services.AddScoped<ISystemLogService, SystemLogService>();
builder.Services.AddScoped<ISshAuditService, SshAuditService>();

// Configure CORS for Frontend integration & WebSockets/SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
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
app.MapHub<TerminalHub>("/hubs/terminal");

app.Run();
