namespace serverMVM.Domain.Enums
{
    public enum DockerProjectStatus
    {
        Running,         // Tất cả container trong project đang UP
        Partial,         // Một số container UP, một số Exited/Dead
        Stopped,         // Tất cả container của project đều Exited
        OrphanedFiles,   // Có file docker-compose.yml nhưng chưa có container nào chạy
        MissingFiles     // Container vẫn còn trên Docker nhưng file YML đã bị xóa/đổi tên
    }
}